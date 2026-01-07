import express, { Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { router as matchEventRouter } from "./matchEvent.router";

export const matchEventModule = (prisma: PrismaClient): Router => {
	return matchEventRouter(express.Router(), prisma);
};

// For backward compatibility
module.exports = matchEventModule;
