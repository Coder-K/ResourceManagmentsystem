
namespace ResourceManagmentsystem
{
    using Microsoft.EntityFrameworkCore;
    using ResourceManagmentsystem.Data;

    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // making a db a db and adding it to the services
            builder.Services.AddDbContext<AppDbContext>(options =>
             options.UseSqlite("Data Source=app.db"));

            //react allows any origin to access the api
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReact",
                    policy => policy.WithOrigins("http://localhost:5174")
                                    .AllowAnyHeader()
                                    .AllowAnyMethod());
            });

            var app = builder.Build();

            app.UseCors("AllowReact");


            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
