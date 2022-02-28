import { ClientErrorResponse } from "@kz-ts/express-common";
import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseMiddlewares,
  ValidateBody,
} from "@kz-ts/ts-express";
import { Document, isValidObjectId } from "mongoose";
import { NextFunction, Request, Response } from "express";
import { CheckAuthenticated } from "../middlewares/auth-check";
import { ProtectedRoute } from "../middlewares/protected-route";
import { IProduct, IProductProps, Product } from "../models/product";
import { handleDocumentSaveError } from "./auth.router";

const normalizeProducts = (
  products: IProduct[]
): { [key: string]: IProduct[] } => {
  const normalizedProducts: { [key: string]: IProduct[] } = {};
  products.forEach((product) => {
    const { category } = product;
    const collectionProducts = normalizedProducts[category] || [];
    collectionProducts.push({
      id: product.id,
      category,
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
    });
    normalizedProducts[category] = collectionProducts;
  });
  return normalizedProducts;
};

@Controller("/products")
class ProductRouter {
  @Get("/")
  getAllProducts(req: Request, res: Response, next: NextFunction): void {
    const collection = req.query["collection"];
    if (!(typeof collection === "string" || collection === undefined)) {
      throw ClientErrorResponse.BadRequest(
        "Collection query must be string or undefined!"
      );
    }
    Product.find({})
      .then((products: IProduct[]) => {
        const productsByCollection = normalizeProducts(products);
        if (collection)
          res.status(200).send(productsByCollection[collection] || []);
        else res.status(200).send(productsByCollection);
      })
      .catch(next);
  }

  @Get("/:productId")
  getCollection(req: Request, res: Response, next: NextFunction): void {
    const productId = req.params["productId"];

    if (!isValidObjectId)
      throw ClientErrorResponse.BadRequest(
        `Not a valid ProductId: ${productId}`
      );

    Product.findById(productId)
      .then((product: IProduct | null) => {
        if (!product)
          throw ClientErrorResponse.NotFound(
            `Product with Id ${productId} Not Found`
          );
        res.status(200).send(product);
      })
      .catch(next);
  }

  @Post("/")
  @UseMiddlewares(CheckAuthenticated, ProtectedRoute)
  @ValidateBody("price", "title", "imageUrl", "category")
  createProduct(req: Request, res: Response, next: NextFunction) {
    const { price, title, imageUrl, category }: IProductProps = req.body;
    const newProduct = Product.createProduct({
      price,
      title,
      imageUrl,
      category,
    });
    newProduct
      .save()
      .then((savedProduct) => {
        res.status(201).send(savedProduct);
      })
      .catch((err) => handleDocumentSaveError(err, next));
  }

  @Patch("/:productId")
  @UseMiddlewares(CheckAuthenticated, ProtectedRoute)
  @ValidateBody("price", "title", "imageUrl", "category")
  updateProduct(req: Request, res: Response, next: NextFunction) {
    const productId = req.params["productId"];

    if (!isValidObjectId)
      throw ClientErrorResponse.BadRequest(
        `Not a valid ProductId: ${productId}`
      );

    const { price, title, imageUrl, category }: IProductProps = req.body;
    Product.findById(productId)
      .then((foundProduct: Document<unknown, any, IProduct> | null) => {
        if (!foundProduct)
          throw ClientErrorResponse.NotFound(
            `Product with Id ${productId} Not Found`
          );
        foundProduct.set({ price, title, imageUrl, category });
        foundProduct
          .save()
          .then((savedProduct) => res.status(202).send(savedProduct))
          .catch((err) => handleDocumentSaveError(err, next));
      })
      .catch(next);
  }

  @Delete("/:productId")
  @UseMiddlewares(CheckAuthenticated, ProtectedRoute)
  @ValidateBody("price", "title", "imageUrl", "category")
  async deleteProduct(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = req.params["productId"];

      if (!isValidObjectId)
        throw ClientErrorResponse.BadRequest(
          `Not a valid ProductId: ${productId}`
        );

      const deletedProduct: IProduct | null = await Product.findOneAndDelete({
        _id: productId,
      });
      if (!deletedProduct)
        throw ClientErrorResponse.NotFound(
          `Product with Id ${productId} Not Found`
        );
      res.status(204).send(deletedProduct);
    } catch (err) {
      next(err);
    }
  }
}
