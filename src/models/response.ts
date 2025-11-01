export type APIResponse = {
  status: "success" | "error";
  message: string;
  data?: any;
  errors?: any;
};