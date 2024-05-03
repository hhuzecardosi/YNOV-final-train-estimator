import {TrainTicketEstimator} from "./train-estimator";
import {Passenger, TripDetails, TripRequest} from "./model/trip.request";

describe("train estimator", function () {
    it('should estimate a train ticket', function () {
        // ARRANGE
        const trainTicketEstimator = new TrainTicketEstimator();
        const tripDetails = new TripDetails("Paris", "Lyon", new Date('2024-06-01'));
        const passengers: Passenger[] = [];
        const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};
        // ACT
        const estimation = trainTicketEstimator.estimate(tripRequest);
        // ASSERT
        expect(estimation).toBeGreaterThan(0);
    });
});
