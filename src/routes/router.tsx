import { createBrowserRouter } from "react-router";
import { HomeRoute } from "@/routes/home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomeRoute />,
  },
]);
