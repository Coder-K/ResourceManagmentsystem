import { get } from "./ApiClient";
import type { Dashboard } from "../Types";

export const getDashboard = () => get<Dashboard>("/dashboard");
