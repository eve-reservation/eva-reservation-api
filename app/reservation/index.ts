import express, { Router } from "express";
import { controller } from "./reservation.controller";
import { router } from "./reservation.router";
import { PrismaClient } from "../../generated/prisma";

export const reservationModule = (prisma: PrismaClient): Router => {
	return router(express.Router(), controller(prisma));
};

// For backward compatibility
module.exports = reservationModule;
