import { ServerErrorHandler } from "@kz-ts/express-common";
import express from "express";
import cookieSession from "cookie-session";
import { AppRouter } from "@kz-ts/ts-express";
import "./routes/auth.router";
import "./routes/order.router";
import "./routes/products.router";
import "./routes/user.router";

const app = express();
interface Section {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  size?: string;
}

const sections: Section[] = [
  {
    title: "hats",
    imageUrl: "https://i.ibb.co/cvpntL1/hats.png",
    id: 1,
    linkUrl: "/shop/hats",
  },
  {
    title: "jackets",
    imageUrl: "https://i.ibb.co/px2tCc3/jackets.png",
    id: 2,
    linkUrl: "/shop/jackets",
  },
  {
    title: "sneakers",
    imageUrl: "https://i.ibb.co/0jqHpnp/sneakers.png",
    id: 3,
    linkUrl: "/shop/sneakers",
  },
  {
    title: "womens",
    imageUrl: "https://i.ibb.co/GCCdy8t/womens.png",
    id: 4,
    linkUrl: "/shop/womens",
    size: "large",
  },
  {
    title: "mens",
    imageUrl: "https://i.ibb.co/R70vBrQ/men.png",
    size: "large",
    id: 5,
    linkUrl: "/shop/mens",
  },
];

app.use(express.json());
app.use(cookieSession({ signed: false, secure: true }));

app.get("/api/sections", (req, res) => res.send(sections));

app.use("/api", AppRouter.router);

app.use(ServerErrorHandler.HandleError);

export { app };
