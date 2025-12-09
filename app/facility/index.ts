import express, { Router } from "express";
import { controller } from "./facility.controller";
import { router } from "./facility.router";
import { PrismaClient } from "../../generated/prisma";

export const facilityModule = (prisma: PrismaClient): Router => {
	return router(express.Router(), controller(prisma));
};

// For backward compatibility
module.exports = facilityModule;
