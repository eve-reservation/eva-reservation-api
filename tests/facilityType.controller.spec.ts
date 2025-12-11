import { controller } from "../app/facilityType/facilityType.controller";
import { groupDataByField } from "../helper/dataGrouping";
import { expect } from "chai";
import { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "../generated/prisma";

const TEST_TIMEOUT = 5000;

describe("FacilityType Controller", () => {
	let facilityTypeController: any;
	let req: Partial<Request>;
	let res: Response;
	let next: NextFunction;
	let prisma: any;
	let sentData: any;
	let statusCode: number;
	const mockFacilityType = {
		id: "507f1f77bcf86cd799439026",
		name: "Deluxe Guest Room",
		description: "Luxury guest room with ocean view",
		spaceType: "ROOM",
		subtype: "GUEST_ROOM",
		organizationId: "507f1f77bcf86cd799439011",
		metadata: {
			bedType: "KING_BED",
			bedCount: 1,
			maxOccupancy: 2,
			roomFeatures: ["OCEAN_VIEW", "BALCONY"],
			amenities: ["ROOM_SERVICE"],
		},
		imageUrl: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockFacilityTypes = [
		{
			id: "507f1f77bcf86cd799439026",
			name: "Deluxe Guest Room",
			spaceType: "ROOM",
			subtype: "GUEST_ROOM",
			organizationId: "507f1f77bcf86cd799439011",
			metadata: { bedType: "KING_BED", bedCount: 1, maxOccupancy: 2 },
			imageUrl: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: "507f1f77bcf86cd799439027",
			name: "Conference Room A",
			spaceType: "ROOM",
			subtype: "CONFERENCE_ROOM",
			organizationId: "507f1f77bcf86cd799439011",
			metadata: { seatingCapacity: 20, hasProjector: true },
			amenities: [],
			roomFeatures: [],
			imageUrl: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: "507f1f77bcf86cd799439028",
			name: "Tennis Court",
			spaceType: "COURT",
			subtype: "TENNIS",
			organizationId: "507f1f77bcf86cd799439011",
			metadata: { sportType: "Tennis", surfaceType: "Clay" },
			amenities: [],
			roomFeatures: [],
			imageUrl: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: "507f1f77bcf86cd799439029",
			name: "Main Dining Room",
			spaceType: "DINING",
			subtype: "FINE_DINING",
			organizationId: "507f1f77bcf86cd799439011",
			metadata: { cuisineType: "Italian", seatingCapacity: 50 },
			amenities: [],
			roomFeatures: [],
			imageUrl: [],
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	];

	beforeEach(() => {
		prisma = {
			facilityType: {
				findMany: async (_params: Prisma.FacilityTypeFindManyArgs) => {
					// Return multiple facilityTypes for grouping tests
					if (req.query?.groupBy) {
						return mockFacilityTypes;
					}
					return [mockFacilityType];
				},
				count: async (_params: Prisma.FacilityTypeCountArgs) => {
					// Return count based on whether grouping is requested
					if (req.query?.groupBy) {
						return mockFacilityTypes.length;
					}
					return 1;
				},
				findFirst: async (params: Prisma.FacilityTypeFindFirstArgs) =>
					params.where?.id === mockFacilityType.id ? mockFacilityType : null,
				findUnique: async (params: Prisma.FacilityTypeFindUniqueArgs) =>
					params.where?.id === mockFacilityType.id ? mockFacilityType : null,
				create: async (params: Prisma.FacilityTypeCreateArgs) => ({
					...mockFacilityType,
					...params.data,
				}),
				update: async (params: Prisma.FacilityTypeUpdateArgs) => ({
					...mockFacilityType,
					...params.data,
				}),
				delete: async (params: Prisma.FacilityTypeDeleteArgs) => ({
					...mockFacilityType,
					id: params.where.id,
				}),
			},
			rateType: {
				findUnique: async (params: Prisma.RateTypeFindUniqueArgs) =>
					params.where?.id === "existingRateTypeId" ? { id: params.where?.id } : null,
			},
			$transaction: async (operations: any) => {
				if (typeof operations === "function") {
					return operations(prisma);
				}
				return await Promise.all(operations);
			},
		};

		facilityTypeController = controller(prisma as PrismaClient);
		sentData = undefined;
		statusCode = 200;
		req = {
			query: {},
			params: {},
			body: {},
			get: (header: string) => {
				if (header === "Content-Type") {
					return "application/json";
				}
				return undefined;
			},
			originalUrl: "/api/facilityType",
		} as Request;
		res = {
			send: (data: any) => {
				sentData = data;
				return res;
			},
			status: (code: number) => {
				statusCode = code;
				return res;
			},
			json: (data: any) => {
				sentData = data;
				return res;
			},
			end: () => res,
		} as Response;
		next = () => {};
	});

	describe(".getAll()", () => {
		it("should return paginated facilityTypes", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "1", limit: "10" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
		});

		it("should group facilityTypes by spaceType field", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { groupBy: "spaceType" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData.data).to.have.property("grouped");
			expect(sentData.data).to.have.property("groupBy", "spaceType");
			expect(sentData.data).to.have.property("totalGroups");
			expect(sentData.data).to.have.property("totalItems");
			expect(sentData.data.grouped).to.have.property("ROOM");
			expect(sentData.data.grouped).to.have.property("COURT");
			expect(sentData.data.grouped).to.have.property("DINING");
		});

		it("should group facilityTypes by name field", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { groupBy: "name" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData.data).to.have.property("grouped");
			expect(sentData.data).to.have.property("groupBy", "name");
			expect(sentData.data.grouped).to.have.property("User Registration FacilityType");
			expect(sentData.data.grouped).to.have.property("SMS Notification FacilityType");
		});

		it("should handle facilityTypes with different spaceTypes", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { groupBy: "spaceType" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData.data.grouped).to.have.property("ROOM");
			expect(sentData.data.grouped.ROOM).to.be.an("array");
			expect(sentData.data.grouped.ROOM.length).to.be.greaterThan(0);
		});

		it("should return normal response when groupBy is not provided", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "1", limit: "10" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData.data).to.be.an("array");
			expect(sentData.data).to.not.have.property("grouped");
		});

		it("should handle empty groupBy parameter", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { groupBy: "" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData.data).to.be.an("array");
		});

		it("should combine grouping with other query parameters", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { groupBy: "spaceType", page: "1", limit: "10", sort: "name" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData.data).to.have.property("grouped");
			expect(sentData.data).to.have.property("groupBy", "spaceType");
		});

		it("should handle query validation failure", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "invalid" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle Prisma errors", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "1", limit: "10" };

			// Mock Prisma to throw an error
			prisma.facilityType.findMany = async () => {
				const error = new Error("Database connection failed") as any;
				error.name = "PrismaClientKnownRequestError";
				error.code = "P1001";
				throw error;
			};

			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle internal errors", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "1", limit: "10" };

			// Mock Prisma to throw a non-Prisma error
			prisma.facilityType.findMany = async () => {
				throw new Error("Internal server error");
			};

			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(500);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle advanced filtering", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = {
				page: "1",
				limit: "10",
				query: "email",
				filter: JSON.stringify([{ field: "type", operator: "equals", value: "email" }]),
			};
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle pagination parameters", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "2", limit: "5", sort: "name", order: "asc" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle field selection", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { fields: "name,type" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle documents parameter", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { documents: "true" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle count parameter", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { count: "true" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle pagination parameter", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { pagination: "true" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});
	});

	describe(".getById()", () => {
		it("should return a facilityType", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };
			await facilityTypeController.getById(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
			expect(sentData.data).to.deep.include({ id: mockFacilityType.id });
		});

		it("should handle invalid ID format", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: "invalid-id" };
			await facilityTypeController.getById(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle non-existent facilityType", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: "507f1f77bcf86cd799439099" };
			await facilityTypeController.getById(req as Request, res, next);
			expect(statusCode).to.equal(404);
			expect(sentData).to.have.property("status", "error");
			expect(sentData).to.have.property("code", "NOT_FOUND");
		});

		it("should handle Prisma errors", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };

			// Mock Prisma to throw an error
			prisma.facilityType.findUnique = async () => {
				const error = new Error("Database connection failed") as any;
				error.name = "PrismaClientKnownRequestError";
				error.code = "P1001";
				throw error;
			};

			await facilityTypeController.getById(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle internal errors", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };

			// Mock Prisma to throw a non-Prisma error
			prisma.facilityType.findUnique = async () => {
				throw new Error("Internal server error");
			};

			await facilityTypeController.getById(req as Request, res, next);
			expect(statusCode).to.equal(500);
			expect(sentData).to.have.property("status", "error");
		});
	});

	describe(".create()", () => {
		it("should create a new facilityType", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Deluxe Ocean View",
				description: "Luxury guest room with ocean view",
				spaceType: "ROOM",
				subtype: "GUEST_ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: {
					bedType: "KING_BED",
					bedCount: 1,
					maxOccupancy: 2,
				},
			};
			req.body = createData;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(201);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
			expect(sentData.data).to.have.property("id");
		});

		it("should create a new facilityType with CONFERENCE_ROOM subtype", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Executive Conference Room",
				description: "Large conference room with AV equipment",
				spaceType: "ROOM",
				subtype: "CONFERENCE_ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: {
					seatingCapacity: 20,
					hasProjector: true,
					hasVideoConferencing: true,
				},
			};
			req.body = createData;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(201);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
			expect(sentData.data).to.have.property("id");
			expect(sentData.data).to.have.property("spaceType", "ROOM");
			expect(sentData.data).to.have.property("subtype", "CONFERENCE_ROOM");
		});

		it("should create a new facilityType with TENNIS COURT", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Indoor Tennis Court",
				description: "Professional indoor tennis court",
				spaceType: "COURT",
				subtype: "TENNIS",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: {
					sportType: "Tennis",
					surfaceType: "Hardcourt",
					isIndoor: true,
				},
			};
			req.body = createData;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(201);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
			expect(sentData.data).to.have.property("id");
		});

		it("should reject creation when rateTypeId does not exist", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Facility with invalid rate type",
				spaceType: "ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				rateTypeId: "nonExistingRateTypeId",
			};
			req.body = createData;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle form data (multipart/form-data)", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Standard Guest Room",
				description: "Standard room from form data",
				spaceType: "ROOM",
				subtype: "GUEST_ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: JSON.stringify({
					bedType: "QUEEN_BED",
					bedCount: 1,
					maxOccupancy: 2,
				}),
			};
			req.body = createData;
			(req as any).get = (header: string) => {
				if (header === "Content-Type") {
					return "multipart/form-data";
				}
				return undefined;
			};
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(201);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle form data (application/x-www-form-urlencoded)", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Meeting Room",
				description: "Conference room from URL encoded data",
				spaceType: "ROOM",
				subtype: "CONFERENCE_ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: JSON.stringify({
					seatingCapacity: 10,
					hasProjector: true,
				}),
			};
			req.body = createData;
			(req as any).get = (header: string) => {
				if (header === "Content-Type") {
					return "application/x-www-form-urlencoded";
				}
				return undefined;
			};
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(201);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle validation errors", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "",
				description: "FacilityType with empty name",
				spaceType: "ROOM",
				organizationId: "507f1f77bcf86cd799439011",
			};
			req.body = createData;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle Prisma errors", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Test FacilityType",
				description: "FacilityType that will cause Prisma error",
				spaceType: "ROOM",
				subtype: "GUEST_ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: {
					bedType: "KING_BED",
					bedCount: 1,
					maxOccupancy: 2,
				},
			};
			req.body = createData;

			// Mock Prisma to throw an error
			prisma.facilityType.create = async () => {
				const error = new Error("Database connection failed") as any;
				error.name = "PrismaClientKnownRequestError";
				error.code = "P1001";
				throw error;
			};

			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle internal errors", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Test FacilityType",
				description: "FacilityType that will cause internal error",
				spaceType: "ROOM",
				subtype: "GUEST_ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: {
					bedType: "KING_BED",
					bedCount: 1,
					maxOccupancy: 2,
				},
			};
			req.body = createData;

			// Mock Prisma to throw a non-Prisma error
			prisma.facilityType.create = async () => {
				throw new Error("Internal server error");
			};

			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(500);
			expect(sentData).to.have.property("status", "error");
		});
	});

	describe(".update()", () => {
		it("should update facilityType details", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "Enhanced Contact Form FacilityType",
				description: "Updated facilityType with additional validation and styling options",
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
			expect(sentData.data).to.have.property("id");
		});

		it("should update facilityType subtype field", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				subtype: "SUITE",
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
			expect(sentData.data).to.have.property("id");
		});

		it("should update multiple facilityType fields including metadata", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "Updated Guest Room",
				description: "Updated description",
				metadata: {
					bedType: "QUEEN_BED",
					bedCount: 2,
					maxOccupancy: 4,
				},
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
			expect(sentData).to.have.property("data");
			expect(sentData.data).to.have.property("id");
		});

		it("should handle form data (multipart/form-data)", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "Form Updated FacilityType",
				description: "Updated from form data",
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;
			(req as any).get = (header: string) => {
				if (header === "Content-Type") {
					return "multipart/form-data";
				}
				return undefined;
			};
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle form data (application/x-www-form-urlencoded)", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "URL Updated FacilityType",
				description: "Updated from URL encoded data",
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;
			(req as any).get = (header: string) => {
				if (header === "Content-Type") {
					return "application/x-www-form-urlencoded";
				}
				return undefined;
			};
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle invalid ID format", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "Updated FacilityType",
			};
			req.params = { id: "invalid-id" };
			req.body = updateData;
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle validation errors", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "",
				description: "FacilityType with empty name",
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle non-existent facilityType update", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "Updated FacilityType",
			};
			req.params = { id: "507f1f77bcf86cd799439099" };
			req.body = updateData;
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(404);
			expect(sentData).to.have.property("status", "error");
			expect(sentData).to.have.property("code", "NOT_FOUND");
		});

		it("should handle Prisma errors", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "Test FacilityType",
				description: "FacilityType that will cause Prisma error",
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;

			// Mock Prisma to throw an error
			prisma.facilityType.update = async () => {
				const error = new Error("Database connection failed") as any;
				error.name = "PrismaClientKnownRequestError";
				error.code = "P1001";
				throw error;
			};

			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle internal errors", async function () {
			this.timeout(TEST_TIMEOUT);
			const updateData = {
				name: "Test FacilityType",
				description: "FacilityType that will cause internal error",
			};
			req.params = { id: mockFacilityType.id };
			req.body = updateData;

			// Mock Prisma to throw a non-Prisma error
			prisma.facilityType.update = async () => {
				throw new Error("Internal server error");
			};

			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(500);
			expect(sentData).to.have.property("status", "error");
		});
	});

	describe(".remove()", () => {
		it("should delete a facilityType", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };
			await facilityTypeController.remove(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle invalid ID format", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: "invalid-id" };
			await facilityTypeController.remove(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle non-existent facilityType deletion", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: "507f1f77bcf86cd799439099" };
			await facilityTypeController.remove(req as Request, res, next);
			expect(statusCode).to.equal(404);
			expect(sentData).to.have.property("status", "error");
			expect(sentData).to.have.property("code", "NOT_FOUND");
		});

		it("should handle Prisma errors", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };

			// Mock Prisma to throw an error
			prisma.facilityType.delete = async () => {
				const error = new Error("Database connection failed") as any;
				error.name = "PrismaClientKnownRequestError";
				error.code = "P1001";
				throw error;
			};

			await facilityTypeController.remove(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle internal errors", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };

			// Mock Prisma to throw a non-Prisma error
			prisma.facilityType.delete = async () => {
				throw new Error("Internal server error");
			};

			await facilityTypeController.remove(req as Request, res, next);
			expect(statusCode).to.equal(500);
			expect(sentData).to.have.property("status", "error");
		});
	});

	describe("Edge Cases and Integration", () => {
		it("should handle empty request body", async function () {
			this.timeout(TEST_TIMEOUT);
			req.body = {};
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle null request body", async function () {
			this.timeout(TEST_TIMEOUT);
			req.body = null;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle undefined request body", async function () {
			this.timeout(TEST_TIMEOUT);
			req.body = undefined;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle very long facilityType name", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "A".repeat(1000), // Very long name
				description: "FacilityType with very long name",
			};
			req.body = createData;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(201);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle special characters in facilityType data", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "FacilityType with special chars: !@#$%^&*()",
				description: "Description with émojis 🚀 and unicode",
				spaceType: "OTHER",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: {
					customType: "Special Type",
					description: "Special facility type",
				},
			};
			req.body = createData;
			await facilityTypeController.create(req as Request, res, next);
			expect(statusCode).to.equal(201);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle concurrent requests", async function () {
			this.timeout(TEST_TIMEOUT);
			const createData = {
				name: "Concurrent FacilityType",
				description: "FacilityType created concurrently",
				spaceType: "ROOM",
				subtype: "GUEST_ROOM",
				organizationId: "507f1f77bcf86cd799439011",
				metadata: {
					bedType: "SINGLE_BED",
					bedCount: 1,
					maxOccupancy: 1,
				},
			};
			req.body = createData;

			// Simulate concurrent requests
			const promises = Array(5)
				.fill(null)
				.map(() => facilityTypeController.create(req as Request, res, next));

			const results = await Promise.all(promises);
			expect(results).to.have.length(5);
		});

		it("should handle malformed JSON in filter", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = {
				page: "1",
				limit: "10",
				filter: "invalid-json",
			};
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle very large page numbers", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "999999", limit: "10" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle very large limit values", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "1", limit: "999999" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle negative page numbers", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "-1", limit: "10" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle negative limit values", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "1", limit: "-10" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle empty string values", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "", limit: "", sort: "", order: "" };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle whitespace-only values", async function () {
			this.timeout(TEST_TIMEOUT);
			req.query = { page: "   ", limit: "   ", sort: "   " };
			await facilityTypeController.getAll(req as Request, res, next);
			expect(statusCode).to.equal(400);
			expect(sentData).to.have.property("status", "error");
		});

		it("should handle missing required fields in update", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };
			req.body = {}; // Empty body
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});

		it("should handle partial updates correctly", async function () {
			this.timeout(TEST_TIMEOUT);
			req.params = { id: mockFacilityType.id };
			req.body = { name: "Only name updated" }; // Only name, no description or type
			await facilityTypeController.update(req as Request, res, next);
			expect(statusCode).to.equal(200);
			expect(sentData).to.have.property("status", "success");
		});
	});
});

describe("Data Grouping Helper", () => {
	const testData = [
		{ id: 1, name: "Guest Room", spaceType: "ROOM", subtype: "GUEST_ROOM" },
		{ id: 2, name: "Conference Room", spaceType: "ROOM", subtype: "CONFERENCE_ROOM" },
		{ id: 3, name: "Tennis Court", spaceType: "COURT", subtype: "TENNIS" },
		{ id: 4, name: "Dining Room", spaceType: "DINING", subtype: null },
		{ id: 5, name: "Parking Lot", spaceType: "PARKING", subtype: "COVERED" },
	];

	describe("groupDataByField()", () => {
		it("should group data by spaceType field", () => {
			const result = groupDataByField(testData, "spaceType");
			expect(result).to.have.property("ROOM");
			expect(result).to.have.property("COURT");
			expect(result).to.have.property("DINING");
			expect(result).to.have.property("PARKING");
			expect(result.ROOM).to.have.length(2);
			expect(result.COURT).to.have.length(1);
			expect(result.DINING).to.have.length(1);
			expect(result.PARKING).to.have.length(1);
		});

		it("should group data by subtype field", () => {
			const result = groupDataByField(testData, "subtype");
			expect(result).to.have.property("GUEST_ROOM");
			expect(result).to.have.property("CONFERENCE_ROOM");
			expect(result).to.have.property("TENNIS");
			expect(result).to.have.property("COVERED");
			expect(result).to.have.property("unassigned");
			expect(result.GUEST_ROOM).to.have.length(1);
			expect(result.CONFERENCE_ROOM).to.have.length(1);
		});

		it("should handle null values by placing them in unassigned group", () => {
			const result = groupDataByField(testData, "subtype");
			expect(result.unassigned).to.have.length(1);
			expect(result.unassigned[0]).to.deep.include({ id: 4, subtype: null });
		});

		it("should handle undefined values by placing them in unassigned group", () => {
			const dataWithUndefined = [
				{ id: 1, name: "Guest Room", spaceType: "ROOM" },
				{ id: 2, name: "Conference Room" }, // missing spaceType field
			];
			const result = groupDataByField(dataWithUndefined, "spaceType");
			expect(result).to.have.property("ROOM");
			expect(result).to.have.property("unassigned");
			expect(result.ROOM).to.have.length(1);
			expect(result.unassigned).to.have.length(1);
		});

		it("should return empty object for empty array", () => {
			const result = groupDataByField([], "spaceType");
			expect(result).to.be.an("object");
			expect(Object.keys(result)).to.have.length(0);
		});

		it("should group by string values correctly", () => {
			const result = groupDataByField(testData, "name");
			expect(result).to.have.property("Guest Room");
			expect(result).to.have.property("Conference Room");
			expect(result).to.have.property("Tennis Court");
			expect(result).to.have.property("Dining Room");
			expect(result).to.have.property("Parking Lot");
			expect(result["Guest Room"]).to.have.length(1);
		});
	});
});
