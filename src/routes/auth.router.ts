import {
  ClientErrorResponse,
  ServerErrorResponse,
} from "@kz-ts/express-common";
import {
  Controller,
  Get,
  Post,
  UseMiddlewares,
  ValidateBody,
} from "@kz-ts/ts-express";
import { NextFunction, Request, Response } from "express";
import { environment } from "../environment";
import { CheckAuthenticated } from "../middlewares/auth-check";
import { ICookiePayload } from "../models/cookie-payload";
import { IUser, IUserProps, User } from "../models/user";
import { Bcrypt } from "../utils/bcrypt.utils";
import { JWT } from "../utils/jwt.utils";

export function handleDocumentSaveError(err: any, next: NextFunction): void {
  const validationError = err.errors;
  const uniqueKeyError = err.keyPattern;

  // UniqueKeyError Handling
  if (uniqueKeyError) {
    next(
      ClientErrorResponse.UnProcessable(
        `Unique value violated: ${Object.keys(uniqueKeyError).join(", ")}`
      )
    );
    return;
  }

  // ValidatorError Handling
  if (validationError) {
    const failedValidationList: string[] = [];
    const failedvalidationType = Object.keys(validationError);
    failedvalidationType.forEach((validation) =>
      failedValidationList.push(validationError[validation].properties.message)
    );

    // sending lists of validation error messages
    next(
      ClientErrorResponse.UnProcessable(
        `Failed Validations: ${failedValidationList.join(", ")}`
      )
    );
    return;
  }
  next(ServerErrorResponse.InternalServer());
}

@Controller("/auth")
class AuthRouter {
  @Post("/logout")
  logOutUser(req: Request, res: Response, next: NextFunction): void {
    req.session = null;
    res.send("LoggedOut!");
  }

  @Get("/current-user")
  @UseMiddlewares(CheckAuthenticated)
  getCurrentUser(req: Request, res: Response, next: NextFunction): void {
    if (req.user) {
      User.findById(req.user.id)
        .populate("currentCartItems.product")
        .populate({
          path: "ordersPlaced",
          populate: {
            path: "products",
            populate: {
              path: "product",
              model: "Product",
            },
          },
        })
        .exec()
        .then((user: IUser | null) => {
          if (!user) {
            res.status(200).send({ currentUser: null });
            return;
          }
          res.status(200).send({ currentUser: user });
          return;
        })
        .catch((err) => {
          res.status(200).send({ currentUser: null });
          return;
        });
    } else {
      res.status(200).send({ currentUser: null });
    }
  }

  @Post("/login")
  @ValidateBody("email", "password")
  async loginUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password }: { email: string; password: string } = req.body;
      const user: IUser | null = await User.findOne({ email })
        .populate("currentCartItems")
        .populate("ordersPlaced")
        .exec();
      if (!user)
        throw ClientErrorResponse.Forbidden(
          "Incorrect combination of email & password!"
        );
      const isPasswordValid = await Bcrypt.compareHash(
        password,
        user.password ? user.password : ""
      );
      if (!isPasswordValid)
        throw ClientErrorResponse.Forbidden(
          "Incorrect combination of email & password!"
        );
      const token = await JWT.generateJWT<ICookiePayload>(
        {
          id: user.id,
          email: user.email,
          name: user.email,
        },
        environment.JWT_SECRET
      );
      req.session = { token };
      res.status(200).send(user);
    } catch (err) {
      next(err);
    }
  }

  @Post("/register")
  @ValidateBody("email", "name", "password")
  async registerUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, name, password }: IUserProps = req.body;
      const newUser = User.createUser({ email, name, password });
      const savedUser: IUser = await newUser.save();
      const token = await JWT.generateJWT<ICookiePayload>(
        {
          email: savedUser.email,
          id: savedUser.id,
          name: savedUser.name,
        },
        environment.JWT_SECRET
      );
      req.session = { token };
      res.status(201).send(savedUser);
    } catch (err: any) {
      handleDocumentSaveError(err, next);
    }
  }
}
