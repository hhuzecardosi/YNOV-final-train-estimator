import {TrainTicketEstimator} from "./train-estimator";
import {ApiException, InvalidTripInputException, Passenger, TripDetails, TripRequest} from "./model/trip.request";

describe("train estimator", function () {
    it('should estimate a train ticket', async function () {
        // ARRANGE
        const trainTicketEstimator = new TrainTicketEstimator();
        const tripDetails = new TripDetails("Paris", "Lyon", new Date('2024-06-01'));
        const passengers: Passenger[] = [];
        const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};
        // ACT
        const estimation = await trainTicketEstimator.estimate(tripRequest);

        // ASSERT
        expect(estimation).toEqual(0);
    });

    describe('throw an error if the trip is invalid', () => {
        it('should throw an error if the start city is invalid', async function () {
            // ARRANGE
            const trainTicketEstimator = new TrainTicketEstimator();
            const tripDetails = new TripDetails("", "Lyon", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(  () => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Start city is invalid'));
        });

        it('should throw an error if the destination city is invalid', async () => {
            const trainTicketEstimator = new TrainTicketEstimator();
            const tripDetails = new TripDetails("Paris", "", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(  () => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Destination city is invalid'));
        });

        it('should throw an error if the date is passed', async () => {
            const trainTicketEstimator = new TrainTicketEstimator();
            const tripDetails = new TripDetails("Paris", "Lyon", new Date('2020-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(() => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Date is invalid'));
        });

        it('should throw an error if city name doesn\'t exist', async () => {
            const trainTicketEstimator = new TrainTicketEstimator();
            const tripDetails = new TripDetails("Boredeo", "Lyon", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(() =>  trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new ApiException());
        });

        it('should throw an error if a passenger has a negative age', async () => {
            const trainTicketEstimator = new TrainTicketEstimator();
            const tripDetails = new TripDetails("Paris", "Lyon", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(-1, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(() => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Age is invalid'));
        });
    });
});
