import { ClientErrorResponse } from "@kz-ts/express-common";
import { Controller, Patch, UseMiddlewares } from "@kz-ts/ts-express";
import { NextFunction, Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { CheckAuthenticated } from "../middlewares/auth-check";
import { ProtectedRoute } from "../middlewares/protected-route";
import { ICartItem } from "../models/cart-item.schema";
import { IProduct } from "../models/product";
import { User } from "../models/user";
import { Bcrypt } from "../utils/bcrypt.utils";
import { handleDocumentSaveError } from "./auth.router";

@Controller("/users")
class UserRouter {
  @Patch("/:userId")
  @UseMiddlewares(CheckAuthenticated, ProtectedRoute)
  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.params["userId"];

      if (!isValidObjectId(userId))
        throw ClientErrorResponse.BadRequest(`Not a valid UserId: ${userId}`);

      const queryType = req.query["update"];
      const client = await User.findById(req.user!.id)
        .populate("currentCartItems.product")
        .exec();
      if (!client) throw ClientErrorResponse.NotFound("Not a validUser");

      if (client.id !== userId)
        throw ClientErrorResponse.UnAuthorized(
          `Not Authorized to update ${userId}`
        );

      switch (queryType) {
        case "info": // case: updating name, email
          const { email, name }: { email: string; name: string } = req.body;
          client.set({ email, name });
          break;
        case "update_cart": // case: updating currentCartItems
          const product = req.body.product as IProduct;
          const operation = req.body.operation as string;
          const cart = req.body.cart as ICartItem[];
          if (operation === "add") {
            // case: add to cart
            if (product) {
              const existing = client.currentCartItems.find(
                (item) => item.product.id === product.id
              );
              if (existing) existing.quantity++;
              else
                client.set({
                  currentCartItems: [
                    ...client.currentCartItems,
                    { quantity: 1, product: product.id },
                  ],
                });
            }
          } else if (operation === "remove") {
            // case: remove from cart
            const existing = client.currentCartItems.find(
              (item) => item.product.id === product.id
            );
            if (existing) {
              if (existing.quantity > 1) existing.quantity--;
              else {
                client.currentCartItems = client.currentCartItems.filter(
                  (item) => item.product.id !== product.id
                );
              }
            } else {
              throw ClientErrorResponse.NotFound(
                `Product:${product.id} not found in cart`
              );
            }
          } else if (operation === "delete") {
            // case: delete from cart
            client.currentCartItems = client.currentCartItems.filter(
              (item) => item.product.id !== product.id
            );
          } else if (operation === "assign") {
            // case: assign to cart
            client.currentCartItems = cart;
          } else {
            throw ClientErrorResponse.UnProcessable(
              "operation must be from [add, remove, delete, assign]"
            );
          }
          break;
        case "update_password":
          const {
            oldPassword,
            newPassword,
          }: { oldPassword: string; newPassword: string } = req.body;
          const isOldPasswordValid = await Bcrypt.compareHash(
            oldPassword,
            client.password || ""
          );
          if (!isOldPasswordValid)
            throw ClientErrorResponse.Forbidden("Old Password is invalid.");
          client.set({ password: newPassword });
          break;
        default:
          throw ClientErrorResponse.UnProcessable(
            `Query update should be from [info, update_cart, update_password]`
          );
      }
      try {
        const updatedClient = await client.save({ validateModifiedOnly: true });
        await updatedClient.populate("currentCartItems.product");
        await updatedClient.populate({
          path: "ordersPlaced",
          populate: {
            path: "products",
            populate: {
              path: "product",
              model: "Product",
            },
          },
        });
        res.status(200).send(updatedClient);
      } catch (err) {
        handleDocumentSaveError(err, next);
      }
    } catch (err) {
      next(err);
    }
  }
}
