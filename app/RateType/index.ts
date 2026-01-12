import express, { Router } from "express";
import { controller } from "./RateType.controller";
import { router } from "./RateType.router";
import { PrismaClient } from "../../generated/prisma";

export const RateTypeModule = (prisma: PrismaClient): Router => {
	return router(express.Router(), controller(prisma));
};

// For backward compatibility
module.exports = RateTypeModule;
