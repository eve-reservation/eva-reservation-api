import { Router, Request, Response, NextFunction } from "express";
import { cache, cacheShort, cacheMedium, cacheUser } from "../../middleware/cache";

interface IController {
	getById(req: Request, res: Response, next: NextFunction): Promise<void>;
	getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
	create(req: Request, res: Response, next: NextFunction): Promise<void>;
	update(req: Request, res: Response, next: NextFunction): Promise<void>;
	remove(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export const router = (route: Router, controller: IController): Router => {
	const routes = Router();
	const path = "/guest";

	/**
	 * @openapi
	 * /api/guest/{id}:
	 *   get:
	 *     summary: Get guest by ID
	 *     description: Retrieve a specific guest by its unique identifier with optional field selection
	 *     tags: [Guest]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *           pattern: '^[0-9a-fA-F]{24}$'
	 *         description: Guest ID (MongoDB ObjectId format)
	 *         example: "507f1f77bcf86cd799439011"
	 *       - in: query
	 *         name: fields
	 *         required: false
	 *         schema:
	 *           type: string
	 *         description: Comma-separated list of fields to include (supports nested fields with dot notation)
	 *         example: "id,firstName,lastName,email"
	 *     responses:
	 *       200:
	 *         description: Guest retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               allOf:
	 *                 - $ref: '#/components/schemas/Success'
	 *                 - type: object
	 *                   properties:
	 *                     data:
	 *                       type: object
	 *                       properties:
	 *                         guest:
	 *                           $ref: '#/components/schemas/Guest'
	 *       400:
	 *         $ref: '#/components/responses/BadRequest'
	 *       401:
	 *         $ref: '#/components/responses/Unauthorized'
	 *       404:
	 *         $ref: '#/components/responses/NotFound'
	 *       500:
	 *         $ref: '#/components/responses/InternalServerError'
	 */
	// Cache individual guest with predictable key for invalidation
	routes.get(
		"/:id",
		cache({
			ttl: 90,
			keyGenerator: (req: Request) => {
				const fields = (req.query as any).fields || "full";
				return `cache:guest:byId:${req.params.id}:${fields}`;
			},
		}),
		controller.getById,
	);

	/**
	 * @openapi
	 * /api/guest:
	 *   get:
	 *     summary: Get all guests
	 *     description: Retrieve guests with advanced filtering, pagination, sorting, field selection, and optional grouping
	 *     tags: [Guest]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: page
	 *         required: false
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           default: 1
	 *         description: Page number for pagination
	 *         example: 1
	 *       - in: query
	 *         name: limit
	 *         required: false
	 *         schema:
	 *           type: integer
	 *           minimum: 1
	 *           maximum: 100
	 *           default: 10
	 *         description: Number of records per page
	 *         example: 10
	 *       - in: query
	 *         name: order
	 *         required: false
	 *         schema:
	 *           type: string
	 *           enum: [asc, desc]
	 *           default: desc
	 *         description: Sort order for results
	 *         example: desc
	 *       - in: query
	 *         name: sort
	 *         required: false
	 *         schema:
	 *           type: string
	 *         description: Field to sort by or JSON object for multi-field sorting
	 *         example: "createdAt"
	 *       - in: query
	 *         name: fields
	 *         required: false
	 *         schema:
	 *           type: string
	 *         description: Comma-separated list of fields to include (supports dot notation)
	 *         example: "id,firstName,lastName,email"
	 *       - in: query
	 *         name: query
	 *         required: false
	 *         schema:
	 *           type: string
	 *         description: Search query to filter by firstName, lastName, email, or phone
	 *         example: "john"
	 *       - in: query
	 *         name: filter
	 *         required: false
	 *         schema:
	 *           type: string
	 *         description: JSON array of filter objects for advanced filtering
	 *         example: '[{"reservationId":"507f1f77bcf86cd799439011"},{"isPrimaryGuest":true}]'
	 *       - in: query
	 *         name: groupBy
	 *         required: false
	 *         schema:
	 *           type: string
	 *         description: Group results by a field name
	 *         example: "reservationId"
	 *       - in: query
	 *         name: document
	 *         required: false
	 *         schema:
	 *           type: string
	 *           enum: ["true"]
	 *         description: Include guest documents in response
	 *       - in: query
	 *         name: pagination
	 *         required: false
	 *         schema:
	 *           type: string
	 *           enum: ["true"]
	 *         description: Include pagination metadata in response
	 *       - in: query
	 *         name: count
	 *         required: false
	 *         schema:
	 *           type: string
	 *           enum: ["true"]
	 *         description: Include total count in response
	 *     responses:
	 *       200:
	 *         description: Guests retrieved successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               allOf:
	 *                 - $ref: '#/components/schemas/Success'
	 *                 - type: object
	 *                   properties:
	 *                     data:
	 *                       type: object
	 *                       properties:
	 *                         guests:
	 *                           type: array
	 *                           items:
	 *                             $ref: '#/components/schemas/Guest'
	 *                           description: Present when document="true" and no groupBy
	 *                         groups:
	 *                           type: object
	 *                           additionalProperties:
	 *                             type: array
	 *                             items:
	 *                               $ref: '#/components/schemas/Guest'
	 *                           description: Present when groupBy is used and document="true"
	 *                         count:
	 *                           type: integer
	 *                           description: Present when count="true"
	 *                         pagination:
	 *                           $ref: '#/components/schemas/Pagination'
	 *                           description: Present when pagination="true"
	 *       400:
	 *         $ref: '#/components/responses/BadRequest'
	 *       401:
	 *         $ref: '#/components/responses/Unauthorized'
	 *       500:
	 *         $ref: '#/components/responses/InternalServerError'
	 */
	// Cache guest list with predictable key for invalidation
	routes.get(
		"/",
		cache({
			ttl: 60,
			keyGenerator: (req: Request) => {
				const queryKey = Buffer.from(JSON.stringify(req.query || {})).toString("base64");
				return `cache:guest:list:${queryKey}`;
			},
		}),
		controller.getAll,
	);

	/**
	 * @openapi
	 * /api/guest:
	 *   post:
	 *     summary: Create new guest
	 *     description: Create a new guest for a reservation with minimal data
	 *     tags: [Guest]
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - reservationId
	 *               - firstName
	 *               - lastName
	 *             properties:
	 *               reservationId:
	 *                 type: string
	 *                 pattern: '^[0-9a-fA-F]{24}$'
	 *                 description: Reservation ID this guest belongs to
	 *                 example: "507f1f77bcf86cd799439011"
	 *               personId:
	 *                 type: string
	 *                 pattern: '^[0-9a-fA-F]{24}$'
	 *                 description: Optional Person ID for full guest details
	 *                 example: "507f1f77bcf86cd799439012"
	 *               firstName:
	 *                 type: string
	 *                 minLength: 1
	 *                 description: Guest first name
	 *                 example: "John"
	 *               lastName:
	 *                 type: string
	 *                 minLength: 1
	 *                 description: Guest last name
	 *                 example: "Doe"
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 description: Guest email address
	 *                 example: "john.doe@example.com"
	 *               phone:
	 *                 type: string
	 *                 description: Guest phone number
	 *                 example: "+1234567890"
	 *               specialRequests:
	 *                 type: string
	 *                 description: Special requests or notes for this guest
	 *                 example: "Vegetarian meal preference"
	 *               dietaryRestrictions:
	 *                 type: string
	 *                 description: Dietary restrictions or allergies
	 *                 example: "No nuts, gluten-free"
	 *               isPrimaryGuest:
	 *                 type: boolean
	 *                 description: Whether this is the primary guest for the reservation
	 *                 default: false
	 *         application/x-www-form-urlencoded:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - reservationId
	 *               - firstName
	 *               - lastName
	 *             properties:
	 *               reservationId:
	 *                 type: string
	 *               firstName:
	 *                 type: string
	 *               lastName:
	 *                 type: string
	 *               email:
	 *                 type: string
	 *               phone:
	 *                 type: string
	 *         multipart/form-data:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - reservationId
	 *               - firstName
	 *               - lastName
	 *             properties:
	 *               reservationId:
	 *                 type: string
	 *               firstName:
	 *                 type: string
	 *               lastName:
	 *                 type: string
	 *               email:
	 *                 type: string
	 *               phone:
	 *                 type: string
	 *     responses:
	 *       201:
	 *         description: Guest created successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               allOf:
	 *                 - $ref: '#/components/schemas/Success'
	 *                 - type: object
	 *                   properties:
	 *                     data:
	 *                       type: object
	 *                       properties:
	 *                         guest:
	 *                           $ref: '#/components/schemas/Guest'
	 *       400:
	 *         $ref: '#/components/responses/BadRequest'
	 *       401:
	 *         $ref: '#/components/responses/Unauthorized'
	 *       404:
	 *         $ref: '#/components/responses/NotFound'
	 *       500:
	 *         $ref: '#/components/responses/InternalServerError'
	 */
	routes.post("/", controller.create);

	/**
	 * @openapi
	 * /api/guest/{id}:
	 *   patch:
	 *     summary: Update guest
	 *     description: Update guest data by ID (partial update)
	 *     tags: [Guest]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *           pattern: '^[0-9a-fA-F]{24}$'
	 *         description: Guest ID (MongoDB ObjectId format)
	 *         example: "507f1f77bcf86cd799439011"
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             minProperties: 1
	 *             properties:
	 *               firstName:
	 *                 type: string
	 *                 minLength: 1
	 *                 description: Guest first name
	 *                 example: "Jane"
	 *               lastName:
	 *                 type: string
	 *                 minLength: 1
	 *                 description: Guest last name
	 *                 example: "Doe"
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 description: Guest email address
	 *                 example: "jane.doe@example.com"
	 *               phone:
	 *                 type: string
	 *                 description: Guest phone number
	 *                 example: "+1234567890"
	 *               specialRequests:
	 *                 type: string
	 *                 description: Special requests or notes
	 *                 example: "Late check-in requested"
	 *               dietaryRestrictions:
	 *                 type: string
	 *                 description: Dietary restrictions
	 *                 example: "Vegan"
	 *               isPrimaryGuest:
	 *                 type: boolean
	 *                 description: Whether this is the primary guest
	 *                 example: true
	 *               personId:
	 *                 type: string
	 *                 pattern: '^[0-9a-fA-F]{24}$'
	 *                 description: Link to Person for full details
	 *                 example: "507f1f77bcf86cd799439012"
	 *     responses:
	 *       200:
	 *         description: Guest updated successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               allOf:
	 *                 - $ref: '#/components/schemas/Success'
	 *                 - type: object
	 *                   properties:
	 *                     data:
	 *                       type: object
	 *                       properties:
	 *                         guest:
	 *                           $ref: '#/components/schemas/Guest'
	 *       400:
	 *         $ref: '#/components/responses/BadRequest'
	 *       401:
	 *         $ref: '#/components/responses/Unauthorized'
	 *       404:
	 *         $ref: '#/components/responses/NotFound'
	 *       500:
	 *         $ref: '#/components/responses/InternalServerError'
	 */
	routes.patch("/:id", controller.update);

	/**
	 * @openapi
	 * /api/guest/{id}:
	 *   delete:
	 *     summary: Delete guest
	 *     description: Soft delete a guest by ID (updates reservation guest count)
	 *     tags: [Guest]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *           pattern: '^[0-9a-fA-F]{24}$'
	 *         description: Guest ID (MongoDB ObjectId format)
	 *         example: "507f1f77bcf86cd799439011"
	 *     responses:
	 *       200:
	 *         description: Guest deleted successfully
	 *         content:
	 *           application/json:
	 *             schema:
	 *               allOf:
	 *                 - $ref: '#/components/schemas/Success'
	 *                 - type: object
	 *                   properties:
	 *                     data:
	 *                       type: object
	 *                       description: Empty object for successful deletion
	 *       400:
	 *         $ref: '#/components/responses/BadRequest'
	 *       401:
	 *         $ref: '#/components/responses/Unauthorized'
	 *       404:
	 *         $ref: '#/components/responses/NotFound'
	 *       500:
	 *         $ref: '#/components/responses/InternalServerError'
	 */
	routes.delete("/:id", controller.remove);

	route.use(path, routes);

	return route;
};
