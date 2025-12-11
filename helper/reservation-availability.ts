import { PrismaClient, ReservationStatus } from "../generated/prisma";

export const DEFAULT_BLOCKING_STATUSES: ReservationStatus[] = [
	ReservationStatus.PENDING,
	ReservationStatus.CONFIRMED,
	ReservationStatus.CHECKED_IN,
];

type Params = {
	prisma: PrismaClient;
	facilityId: string;
	startDateTime: Date | string;
	endDateTime: Date | string;
	excludeReservationId?: string;
	blockingStatuses?: ReservationStatus[];
};

export type ConflictResult = {
	isAvailable: boolean;
	conflicts: {
		id: string;
		status: ReservationStatus;
		facilityId: string;
		bookingPeriod: {
			startDateTime: Date;
			endDateTime: Date;
		} | null;
	}[];
};

/**
 * Checks if a facility has overlapping reservations for the provided period.
 * Time windows are considered conflicting when (existing.start < requestedEnd) AND (existing.end > requestedStart).
 * Optional excludeReservationId lets updates ignore the current record.
 */
export async function checkFacilityReservationConflicts({
	prisma,
	facilityId,
	startDateTime,
	endDateTime,
	excludeReservationId,
	blockingStatuses = DEFAULT_BLOCKING_STATUSES,
}: Params): Promise<ConflictResult> {
	const start = new Date(startDateTime);
	const end = new Date(endDateTime);

	// Safety: end must be after start
	if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
		throw new Error("Invalid startDateTime or endDateTime provided for availability check");
	}
	if (end <= start) {
		throw new Error("endDateTime must be after startDateTime");
	}

	const conflicts = await prisma.reservation.findMany({
		where: {
			facilityId,
			id: excludeReservationId ? { not: excludeReservationId } : undefined,
			status: { in: blockingStatuses },
			bookingPeriod: {
				is: {
					startDateTime: { lt: end },
					endDateTime: { gt: start },
				},
			},
		},
		select: {
			id: true,
			status: true,
			facilityId: true,
			bookingPeriod: {
				select: {
					startDateTime: true,
					endDateTime: true,
				},
			},
		},
	});

	return {
		isAvailable: conflicts.length === 0,
		conflicts,
	};
}

