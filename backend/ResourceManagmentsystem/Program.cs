using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ResourceManagmentsystem.Data;
using ResourceManagmentsystem.Services;

namespace ResourceManagmentsystem
{


    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);


            // Cofigaring token variable to make sure key is present and strong 
            var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
            if (Encoding.UTF8.GetByteCount(jwt.Key ?? string.Empty) < 32)
                throw new InvalidOperationException("Jwt:Key must be at least 32 bytes. Set it with: dotnet user-secrets set \"Jwt:Key\" \"<random 64 chars>\" " +
                    "(or the Jwt__Key environment variable). In Development it comes from appsettings.Development.json.");
            builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddProblemDetails();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                // to allow use of token to test in swagger 
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Paste the token returned by POST /api/auth/login"
                });
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
                        Array.Empty<string>()
                    }
                });
            });

            // making a db a db and adding it to the services
            builder.Services.AddDbContext<AppDbContext>(options =>
             options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=app.db"));

            //react allows any origin to access the api
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReact",
                    policy => policy.WithOrigins("http://localhost:5173")
                                    .WithHeaders("Authorization", "Content-Type")
                                    .WithMethods("GET", "POST", "PUT", "DELETE"));
            });

            builder.Services.AddSingleton<PasswordService>();
            builder.Services.AddScoped<TokenProvider>();
            builder.Services.AddScoped<SessionService>();
            builder.Services.AddScoped<ProjectService>();


            // ---------- Authentication: JWT bearer ----------
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;      // keep claim names as written: sub, jti, role ...
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwt.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwt.Audience,
                    ValidateLifetime = true,
                    RequireExpirationTime = true,
                    RequireSignedTokens = true,
                    ValidateIssuerSigningKey = true,
                    // the key now comes from configuration (it was the literal text "Jwt:Secret" before)
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key!)),
                    ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 },   // blocks "alg: none" / algorithm swapping
                    ClockSkew = TimeSpan.Zero,
                    NameClaimType = "name",
                    RoleClaimType = "role"
                };
                options.Events = new JwtBearerEvents
                {
                    // After the signature checks pass, make sure the server-side session is alive
                    // (1-hour idle timeout, logout, role change, deactivated account).
                    OnTokenValidated = async ctx =>
                    {
                        var sessions = ctx.HttpContext.RequestServices.GetRequiredService<SessionService>();
                        var p = ctx.Principal;
                        var ok = await sessions.ValidateAsync(p?.FindFirst("jti")?.Value, p?.FindFirst("sub")?.Value, p?.FindFirst("role")?.Value);
                        if (!ok) ctx.Fail("Session expired or revoked.");
                    }
                };
            });

            // Secure by default: every endpoint needs a logged-in user unless it says [AllowAnonymous].
            builder.Services.AddAuthorization(options =>
                options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

            // ---------- Rate limiting: brute-force protection on login ----------
            builder.Services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
                    ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions { PermitLimit = 10, Window = TimeSpan.FromMinutes(1) }));
            });

            var app = builder.Build();

            // ---------- Database: apply migrations, make sure an admin exists ----------
            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.Migrate();
                await DbSeeder.SeedAsync(db, scope.ServiceProvider.GetRequiredService<PasswordService>(),
                                         app.Configuration, app.Logger);
            }

            // ---------- Pipeline (the ORDER matters) ----------
            app.UseExceptionHandler();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseHsts();
                app.UseHttpsRedirection();   // dev runs plain http so the React dev server can call it without certificate trouble
            }

            app.Use(async (ctx, next) =>     // security headers on every response
            {
                var h = ctx.Response.Headers;
                h["X-Content-Type-Options"] = "nosniff";
                h["X-Frame-Options"] = "DENY";
                h["Referrer-Policy"] = "no-referrer";
                h["Cache-Control"] = "no-store";
                if (!ctx.Request.Path.StartsWithSegments("/swagger"))
                    h["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
                await next();
            });

            app.UseCors("AllowReact");       // CORS first, so even error responses carry the CORS headers
            app.UseRateLimiter();
            app.UseAuthentication();
            app.UseAuthorization();          // (it was called twice before)
            app.MapControllers();

            app.Run();
        }
    }
}
