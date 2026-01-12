import express, { Router } from "express";
import { controller } from "./location.controller";
import { router } from "./location.router";
import { PrismaClient } from "../../generated/prisma";

export const locationModule = (prisma: PrismaClient): Router => {
	return router(express.Router(), controller(prisma));
};

// For backward compatibility
module.exports = locationModule;
