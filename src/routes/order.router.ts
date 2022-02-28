import { ClientErrorResponse } from "@kz-ts/express-common";
import {
  Controller,
  Post,
  UseMiddlewares,
  ValidateBody,
} from "@kz-ts/ts-express";
import { NextFunction, Request, Response } from "express";
import { CheckAuthenticated } from "../middlewares/auth-check";
import { ProtectedRoute } from "../middlewares/protected-route";
import { ICartItem } from "../models/cart-item.schema";
import { Order } from "../models/order";
import { User } from "../models/user";
import { stripe } from "../utils/stripe";
import { handleDocumentSaveError } from "./auth.router";

const calculatePrice = (items: ICartItem[]): number =>
  items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

@Controller("/orders")
class OrderRouter {
  @Post("/")
  @UseMiddlewares(CheckAuthenticated, ProtectedRoute)
  @ValidateBody("cart", "token")
  async createOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { cart, token }: { token: string; cart: ICartItem[] } = req.body;
      const user = await User.findById(req.user!.id);
      if (!user) throw ClientErrorResponse.Forbidden();

      // calculate price
      const price = calculatePrice(cart);

      const _cart = cart.map((item) => {
        return { quantity: item.quantity, product: item.product.id };
      });

      // creating charge
      const charge = await stripe.charges.create({
        currency: "inr",
        amount: price * 100,
        source: token,
      });
      const newOrder = Order.createOrder({
        price,
        stripeId: charge.id,
        products: _cart,
        user,
      });
      try {
        const savedOrder = await newOrder.save();
        user.ordersPlaced.push(savedOrder.id);
        user.currentCartItems = [];
        await user.save({ validateModifiedOnly: true });
        res.status(201).send(await savedOrder.populate("products"));
      } catch (err) {
        handleDocumentSaveError(err, next);
      }
    } catch (err) {
      next(err);
    }
  }
}
