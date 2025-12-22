import express, { Router } from "express";
import { controller } from "./addon.controller";
import { router } from "./addon.router";
import { PrismaClient } from "../../generated/prisma";

export const addonModule = (prisma: PrismaClient): Router => {
	return router(express.Router(), controller(prisma));
};

// For backward compatibility
module.exports = addonModule;
