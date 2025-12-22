import express, { Router } from "express";
import { controller } from "./guest.controller";
import { router } from "./guest.router";
import { PrismaClient } from "../../generated/prisma";

export const guestModule = (prisma: PrismaClient): Router => {
	return router(express.Router(), controller(prisma));
};

// For backward compatibility
module.exports = guestModule;
