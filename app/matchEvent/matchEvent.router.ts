import { Router, Request, Response, NextFunction } from "express";
import { cache } from "../../middleware/cache";
import { PrismaClient } from "../../generated/prisma";
import { controller } from "./matchEvent.controller";

interface IController {
	getById(req: Request, res: Response, next: NextFunction): Promise<void>;
	getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
	create(req: Request, res: Response, next: NextFunction): Promise<void>;
	update(req: Request, res: Response, next: NextFunction): Promise<void>;
	remove(req: Request, res: Response, next: NextFunction): Promise<void>;
	joinEvent(req: Request, res: Response, next: NextFunction): Promise<void>;
	leaveEvent(req: Request, res: Response, next: NextFunction): Promise<void>;
	updateParticipant(req: Request, res: Response, next: NextFunction): Promise<void>;
	getParticipants(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export const router = (route: Router, prisma: PrismaClient): Router => {
	const routes = Router();
	const path = "/match-event";
	const matchEventController = controller(prisma) as IController;

	/**
	 * @openapi
	 * /api/match-event/{id}:
	 *   get:
	 *     summary: Get match event by ID
	 *     description: Retrieve a specific match event by its unique identifier
	 *     tags: [MatchEvent]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *           pattern: '^[0-9a-fA-F]{24}$'
	 *         description: Match event ID (MongoDB ObjectId format)
	 *     responses:
	 *       200:
	 *         description: Match event retrieved successfully
	 *       400:
	 *         description: Bad request
	 *       404:
	 *         description: Match event not found
	 */
	routes.get(
		"/:id",
		cache({
			ttl: 90,
			keyGenerator: (req: Request) => {
				const fields = (req.query as any).fields || "full";
				return `cache:matchEvent:byId:${req.params.id}:${fields}`;
			},
		}),
		matchEventController.getById,
	);

	/**
	 * @openapi
	 * /api/match-event:
	 *   get:
	 *     summary: Get all match events
	 *     description: Retrieve match events with filtering, pagination, and sorting
	 *     tags: [MatchEvent]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: query
	 *         name: page
	 *         schema:
	 *           type: integer
	 *           default: 1
	 *       - in: query
	 *         name: limit
	 *         schema:
	 *           type: integer
	 *           default: 10
	 *       - in: query
	 *         name: status
	 *         schema:
	 *           type: string
	 *           enum: [DRAFT, OPEN, FULL, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED]
	 *       - in: query
	 *         name: query
	 *         schema:
	 *           type: string
	 *         description: Search by title or description
	 *     responses:
	 *       200:
	 *         description: Match events retrieved successfully
	 */
	routes.get(
		"/",
		cache({
			ttl: 60,
			keyGenerator: (req: Request) => {
				const queryKey = Buffer.from(JSON.stringify(req.query || {})).toString("base64");
				return `cache:matchEvent:list:${queryKey}`;
			},
		}),
		matchEventController.getAll,
	);

	/**
	 * @openapi
	 * /api/match-event:
	 *   post:
	 *     summary: Create a new match event
	 *     description: Create a match event for an existing reservation
	 *     tags: [MatchEvent]
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
	 *               - title
	 *             properties:
	 *               reservationId:
	 *                 type: string
	 *               title:
	 *                 type: string
	 *               description:
	 *                 type: string
	 *               maxParticipants:
	 *                 type: integer
	 *                 default: 10
	 *               minParticipants:
	 *                 type: integer
	 *                 default: 2
	 *               skillLevel:
	 *                 type: string
	 *               autoAccept:
	 *                 type: boolean
	 *                 default: false
	 *     responses:
	 *       201:
	 *         description: Match event created successfully
	 *       400:
	 *         description: Bad request
	 */
	routes.post("/", matchEventController.create);

	/**
	 * @openapi
	 * /api/match-event/{id}:
	 *   patch:
	 *     summary: Update match event
	 *     description: Update match event details (only creator can update)
	 *     tags: [MatchEvent]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Match event updated successfully
	 *       403:
	 *         description: Unauthorized
	 *       404:
	 *         description: Match event not found
	 */
	routes.patch("/:id", matchEventController.update);

	/**
	 * @openapi
	 * /api/match-event/{id}:
	 *   delete:
	 *     summary: Delete match event
	 *     description: Delete a match event (only creator can delete)
	 *     tags: [MatchEvent]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Match event deleted successfully
	 *       403:
	 *         description: Unauthorized
	 */
	routes.delete("/:id", matchEventController.remove);

	/**
	 * @openapi
	 * /api/match-event/{id}/join:
	 *   post:
	 *     summary: Join a match event (Public)
	 *     description: Request to join a match event. Authentication is optional. You can provide userId or personId in the request body.
	 *     tags: [MatchEvent]
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               userId:
	 *                 type: string
	 *                 description: User ID (optional if authenticated, required if joining with group)
	 *               personId:
	 *                 type: string
	 *                 description: Person ID (alternative to userId)
	 *               notes:
	 *                 type: string
	 *               groupMembers:
	 *                 type: array
	 *                 description: Array of unregistered users joining with you
	 *                 items:
	 *                   type: object
	 *                   required:
	 *                     - firstName
	 *                     - lastName
	 *                   properties:
	 *                     firstName:
	 *                       type: string
	 *                     lastName:
	 *                       type: string
	 *                     email:
	 *                       type: string
	 *                     phone:
	 *                       type: string
	 *     responses:
	 *       201:
	 *         description: Successfully joined match event
	 *       400:
	 *         description: Cannot join event or userId/personId required
	 */
	routes.post("/:id/join", matchEventController.joinEvent);

	/**
	 * @openapi
	 * /api/match-event/{id}/leave:
	 *   post:
	 *     summary: Leave a match event
	 *     description: Leave a match event you've joined
	 *     tags: [MatchEvent]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *     responses:
	 *       200:
	 *         description: Successfully left match event
	 */
	routes.post("/:id/leave", matchEventController.leaveEvent);

	/**
	 * @openapi
	 * /api/match-event/{id}/participants:
	 *   get:
	 *     summary: Get participants for a match event
	 *     description: Retrieve all participants of a match event. Use status query parameter to filter by status (e.g., WAITLIST, ACCEPTED, PENDING).
	 *     tags: [MatchEvent]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Match Event ID
	 *         example: "695cd539e5800f65afc9ebd5"
	 *       - in: query
	 *         name: status
	 *         schema:
	 *           type: string
	 *           enum: [PENDING, ACCEPTED, REJECTED, WAITLIST, CONFIRMED, CHECKED_IN, NO_SHOW, LEFT]
	 *         description: "Filter participants by status. Example: ?status=WAITLIST to see all waitlist participants"
	 *         example: "WAITLIST"
	 *       - in: query
	 *         name: fields
	 *         schema:
	 *           type: string
	 *         description: Comma-separated list of fields to include in response
	 *         example: "id,status,userId,personId,metadata,joinedAt"
	 *     responses:
	 *       200:
	 *         description: Participants retrieved successfully
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
	 *                         participants:
	 *                           type: array
	 *                           items:
	 *                             $ref: '#/components/schemas/MatchParticipant'
	 *                         total:
	 *                           type: integer
	 *       404:
	 *         $ref: '#/components/responses/NotFound'
	 */
	routes.get("/:id/participants", matchEventController.getParticipants);

	/**
	 * @openapi
	 * /api/match-event/participant/{participantId}:
	 *   patch:
	 *     summary: Update participant status (approve/reject/confirm)
	 *     description: |
	 *       Update participant status. Use this to approve waitlist participants (change WAITLIST to ACCEPTED).
	 *       Only event creator can update participant status.
	 *       
	 *       **Group Approval Feature:** If you approve a group leader (participant with `metadata.isGroupLeader: true`),
	 *       all their group members will be automatically approved as well. This saves time when approving groups.
	 *       
	 *       **Capacity Validation:** The system validates that approving participants won't exceed `maxParticipants`.
	 *       If the event is already full, you'll receive an error message. When approving a group, it checks if there's
	 *       space for all group members before approving them.
	 *     tags: [MatchEvent]
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: participantId
	 *         required: true
	 *         schema:
	 *           type: string
	 *         description: Participant ID
	 *         example: "695daedc7e100e9fa4517ed2"
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             properties:
	 *               status:
	 *                 type: string
	 *                 enum: [ACCEPTED, REJECTED, CONFIRMED, CHECKED_IN, NO_SHOW]
	 *                 description: New participant status. Use ACCEPTED to approve a WAITLIST participant. If approving a group leader, all group members will be auto-approved.
	 *                 example: "ACCEPTED"
	 *               notes:
	 *                 type: string
	 *                 description: Optional notes about the status change
	 *                 example: "Approved from waitlist"
	 *     responses:
	 *       200:
	 *         description: Participant updated successfully. If a group leader was approved, includes auto-approved group members.
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
	 *                         participant:
	 *                           $ref: '#/components/schemas/MatchParticipant'
	 *                         autoApprovedGroupMembers:
	 *                           type: array
	 *                           description: Array of automatically approved group members (only present when approving a group leader)
	 *                           items:
	 *                             $ref: '#/components/schemas/MatchParticipant'
	 *                         totalAutoApproved:
	 *                           type: integer
	 *                           description: Number of group members auto-approved (only present when approving a group leader)
	 *       400:
	 *         description: Bad request - Either validation failed, event is full (exceeds maxParticipants), or trying to approve more participants than available spots
	 *         content:
	 *           application/json:
	 *             schema:
	 *               allOf:
	 *                 - $ref: '#/components/schemas/Error'
	 *                 - type: object
	 *                   properties:
	 *                     message:
	 *                       type: string
	 *                       example: "Cannot approve participant: Event is full. Maximum 12 participants allowed, but 12 are already accepted."
	 *       403:
	 *         description: Unauthorized - Only event creator can update participant status
	 *       404:
	 *         $ref: '#/components/responses/NotFound'
	 *       500:
	 *         $ref: '#/components/responses/InternalServerError'
	 */
	routes.patch("/participant/:participantId", matchEventController.updateParticipant);

	route.use(path, routes);

	return route;
};

