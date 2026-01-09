import express, { Router } from "express";
import { controller } from "./facilityType.controller";
import { router } from "./facilityType.router";
import { PrismaClient } from "../../generated/prisma";

export const facilityTypeModule = (prisma: PrismaClient): Router => {
	return router(express.Router(), controller(prisma));
};

// For backward compatibility
module.exports = facilityTypeModule;
