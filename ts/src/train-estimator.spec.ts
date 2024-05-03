import {TrainTicketEstimator} from "./train-estimator";
import {ApiException, InvalidTripInputException, Passenger, TripDetails, TripRequest} from "./model/trip.request";
import {ApiFacade} from "./external/api-facade";

class FakeApiFacade implements ApiFacade{
    async getPriceEstimation(from: string, to: string, when: Date): Promise<number | -1> {
        if (from === "Bordeaos" || to === "Bordeaos") {
            return -1;
        }
        return 23;
    }
}

describe("train estimator", function () {
    let apiFacade: FakeApiFacade;
    let trainTicketEstimator: TrainTicketEstimator;

    beforeEach(() => {
        apiFacade = new FakeApiFacade();
        trainTicketEstimator = new TrainTicketEstimator(apiFacade);
    });
    it('should estimate a train ticket', async function () {
        // ARRANGE
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
            const tripDetails = new TripDetails("", "Lyon", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(  () => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Start city is invalid'));
        });

        it('should throw an error if the destination city is invalid', async () => {
            const tripDetails = new TripDetails("Paris", "", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(  () => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Destination city is invalid'));
        });

        it('should throw an error if the date is passed', async () => {
            const tripDetails = new TripDetails("Paris", "Lyon", new Date('2020-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(() => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Date is invalid'));
        });

        it('should throw an error if city name doesn\'t exist', async () => {
            const tripDetails = new TripDetails("Bordeaos", "Lyon", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(() =>  trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new ApiException());
        });

        it('should throw an error if a passenger has a negative age', async () => {
            const tripDetails = new TripDetails("Paris", "Lyon", new Date('2024-06-01'));
            const passengers: Passenger[] = [new Passenger(-1, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            // ASSERT
            await expect(() => trainTicketEstimator.estimate(tripRequest)).rejects.toThrow(new InvalidTripInputException('Age is invalid'));
        });
    });
});
