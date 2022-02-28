import { Stripe } from "stripe";
import { environment } from "../environment";

export const stripe = new Stripe(environment.STRIPE_KEY, {
  apiVersion: "2020-08-27",
});
