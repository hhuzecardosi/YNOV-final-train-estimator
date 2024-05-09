import {TrainTicketEstimator} from "./train-estimator";
import {
    ApiException,
    DiscountCard,
    InvalidTripInputException,
    Passenger,
    TripDetails,
    TripRequest
} from "./model/trip.request";
import {ApiFacade} from "./external/api-facade";

const trainTicketPrice = 23;

class FakeApiFacade implements ApiFacade{
    async getPriceEstimation(from: string, to: string, when: Date): Promise<number | -1> {
        if (from === "Bordeaos" || to === "Bordeaos") {
            return -1;
        }
        return trainTicketPrice;
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

    describe('should estimate the price of a train ticket without discount', () => {
        const testCases = [
            {passengers: [3], daysBeforeDeparture: 30, hoursBeforeDeparture: 0, expectedPrice: 9},
            {passengers: [3], daysBeforeDeparture: 5, hoursBeforeDeparture: 0, expectedPrice: 9},

            {passengers: [25], daysBeforeDeparture: 30, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 1.2) - (trainTicketPrice * 0.2)},
            {passengers: [25], daysBeforeDeparture: 6, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 1.2) + (trainTicketPrice * 0.28)},
            {passengers: [25], daysBeforeDeparture: 3, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 1.2) + (trainTicketPrice)},
            {passengers: [25], daysBeforeDeparture: 0, hoursBeforeDeparture: 5, expectedPrice: (trainTicketPrice * 1.2) + (trainTicketPrice) * -0.2},
            {passengers: [25], daysBeforeDeparture: 18, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 1.2) + (trainTicketPrice * 0.04)},

            {passengers: [10], daysBeforeDeparture: 30, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.6) - (trainTicketPrice * 0.2)},
            {passengers: [10], daysBeforeDeparture: 6, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.6) + (trainTicketPrice * 0.28)},
            {passengers: [10], daysBeforeDeparture: 3, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.6) + (trainTicketPrice)},
            {passengers: [10], daysBeforeDeparture: 0, hoursBeforeDeparture: 5, expectedPrice: (trainTicketPrice * 0.6) + (trainTicketPrice) * -0.2},
            {passengers: [10], daysBeforeDeparture: 18, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.6) + (trainTicketPrice * 0.04)},

            {passengers: [71], daysBeforeDeparture: 30, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.8) - (trainTicketPrice * 0.2)},
            {passengers: [71], daysBeforeDeparture: 6, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.8) + (trainTicketPrice * 0.28)},
            {passengers: [71], daysBeforeDeparture: 3, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.8) + (trainTicketPrice)},
            {passengers: [71], daysBeforeDeparture: 0, hoursBeforeDeparture: 5, expectedPrice: (trainTicketPrice * 0.8) + (trainTicketPrice) * -0.2},
            {passengers: [71], daysBeforeDeparture: 18, hoursBeforeDeparture: 0, expectedPrice: (trainTicketPrice * 0.8) + (trainTicketPrice * 0.04)},
        ]

        testCases.forEach(async (testCase) => {
            it(`should estimate the price for passengers with ages: ${testCase.passengers.join(',')}, at ${testCase.daysBeforeDeparture} days and ${testCase.hoursBeforeDeparture} before departure`, async () => {
                const year = new Date().getFullYear();
                const month = new Date().getMonth();
                const day = new Date().getDate() + testCase.daysBeforeDeparture;
                const hours = new Date().getHours() + testCase.hoursBeforeDeparture;
                const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day, hours, 0, 0));
                const passengers: Passenger[] = testCase.passengers.map(age => new Passenger(age, []));
                const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

                // ACT
                const estimation = await trainTicketEstimator.estimate(tripRequest);

                // ASSERT
                expect(estimation).toEqual(testCase.expectedPrice);

            });
        });
        it('should estimate the price of a train ticket for a passenger between 18 and 70 at 30 days before the departure', async () => {
            // ARRANGE
            const year = new Date().getFullYear();
            const month = new Date().getMonth();
            const day = new Date().getDate();
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day + 30, 14, 55, 0));
            const passengers: Passenger[] = [new Passenger(25, [])];
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation = await trainTicketEstimator.estimate(tripRequest);

            // ASSERT
            expect(estimation).toEqual((trainTicketPrice * 1.2) - (trainTicketPrice * 0.2));
        });
    });

    describe('train ticket estimation with a discount', () => {
        let year: number;
        let month: number;
        let day: number;

        beforeEach(() => {
            year = new Date().getFullYear();
            month = new Date().getMonth();
            day = new Date().getDate();
        });
        it('should cost only 1e with TrainStroke Staff reduction plan', async () => {
            // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day, 0, 0, 0));
            const passengers: Passenger[] = [new Passenger(39, [DiscountCard.TrainStroke])]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation = await trainTicketEstimator.estimate(tripRequest);

            // ASSERT
            expect(estimation).toBe(1)
        });

        it('should add a 20% reduction for a senior', async () => {
           // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day + 30, 0, 0, 0));
            const passengers: Passenger[] = [new Passenger(71, [DiscountCard.Senior])]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation = await trainTicketEstimator.estimate(tripRequest);

            const ageReduction = trainTicketPrice * 0.8;
            const seniorReduction = trainTicketPrice * 0.2;
            const dateReduction = trainTicketPrice * 0.2;


            // ASSERT
            expect(estimation).toBe(ageReduction - dateReduction - seniorReduction);
        });

        it('should add a 20% reduction for couple', async () => {
            // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day + 30, 0, 0, 0));
            const passengers: Passenger[] = [new Passenger(25, [DiscountCard.Couple]), new Passenger(28, [])]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation1 = await trainTicketEstimator.estimate(tripRequest);

            const passenger1 = trainTicketPrice * 1.2;
            const passenger2 = trainTicketPrice * 1.2;
            const coupleReduction = trainTicketPrice * 0.2;
            const dateReduction = trainTicketPrice * 0.2;

            // ASSERT
            expect(estimation1).toBe((passenger1 - coupleReduction - dateReduction) + (passenger2 - coupleReduction - dateReduction));
        });

        it('should add a 40% reduction for a couple of senior', async () => {
            // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day + 30, 0, 0, 0));
            const passengers: Passenger[] = [new Passenger(71, [DiscountCard.Couple, DiscountCard.Senior]), new Passenger(72, [DiscountCard.Senior])]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation = await trainTicketEstimator.estimate(tripRequest);

            const passenger1 = trainTicketPrice * 0.8;
            const passenger2 = trainTicketPrice * 0.8;
            const coupleReduction = trainTicketPrice * 0.2;
            const seniorReduction = trainTicketPrice * 0.2;
            const dateReduction = trainTicketPrice * 0.2;

            // ASSERT
            expect(estimation).toBe((passenger1 - coupleReduction - dateReduction - seniorReduction) + (passenger2 - seniorReduction - dateReduction - coupleReduction));
        });

        it('should add a 10% reduction for a Mi-Couple reduction', async () => {
            // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day + 30, 0, 0, 0));
            const passengers: Passenger[] = [new Passenger(25, [DiscountCard.HalfCouple])]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation = await trainTicketEstimator.estimate(tripRequest);

            const passenger1 = trainTicketPrice * 1.2;
            const coupleReduction = trainTicketPrice * 0.1;
            const dateReduction = trainTicketPrice * 0.2;

            // ASSERT
            expect(estimation).toBe((passenger1 - dateReduction - coupleReduction));
        });
    });

    describe('train reservation at 6h before departure', () => {

        let year: number;
        let month: number;
        let day: number;
        let hours: number;

        beforeEach(() => {
            year = new Date().getFullYear();
            month = new Date().getMonth();
            day = new Date().getDate();
            hours = new Date().getHours();
        });

        it('should apply a 20% discount', async () => {
            // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day, hours + 5, 0, 0));
            const passengers: Passenger[] = [new Passenger(39, [])]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation = await trainTicketEstimator.estimate(tripRequest);

            const passenger = trainTicketPrice * 1.2;
            const dateReduction = trainTicketPrice * - 0.2;

            // ASSERT
            expect(estimation).toBe((passenger + dateReduction));
        });
    });
    
    describe('Family card should apply 30% discount', () => {
        
        let lastName: string;
        let year: number;
        let month: number;
        let day: number;
        let hours: number;

        beforeEach(() => {
            lastName = 'Dupont';
            year = new Date().getFullYear();
            month = new Date().getMonth();
            day = new Date().getDate();
            hours = new Date().getHours();
        });

        it('should apply a 30% reduction for all adult passenger', async () => {
            // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day + 30, 0, 0, 0));
            const passengers: Passenger[] = [new Passenger(25, [DiscountCard.Family], lastName), new Passenger(28, [], lastName), new Passenger(3, [], lastName)]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation1 = await trainTicketEstimator.estimate(tripRequest);

            const passenger1 = trainTicketPrice * 1.2;
            const passenger2 = trainTicketPrice * 1.2;
            const passenger3 = 9;
            const familyReduction = trainTicketPrice * 0.3;
            const dateReduction = trainTicketPrice * 0.2;

            // ASSERT
            expect(estimation1).toBe((passenger1 - familyReduction - dateReduction) + (passenger2 - familyReduction - dateReduction) + passenger3);
        });

        it('should apply a 30% reduction for the adult with family card but not the other', async () => {
            // ARRANGE
            const tripDetails = new TripDetails("Paris", "Lyon", new Date(year, month, day + 30, 0, 0, 0));
            const passengers: Passenger[] = [new Passenger(25, [DiscountCard.Family], lastName), new Passenger(28, [], 'Durant'), new Passenger(3, [], lastName)]
            const tripRequest: TripRequest = {details: tripDetails, passengers: passengers};

            // ACT
            const estimation1 = await trainTicketEstimator.estimate(tripRequest);

            const passenger1 = trainTicketPrice * 1.2;
            const passenger2 = trainTicketPrice * 1.2;
            const passenger3 = 9;
            const familyReduction = trainTicketPrice * 0.3;
            const dateReduction = trainTicketPrice * 0.2;

            // ASSERT
            expect(estimation1).toBe((passenger1 - familyReduction - dateReduction) + (passenger2 - dateReduction) + passenger3);
        });
    });
});
