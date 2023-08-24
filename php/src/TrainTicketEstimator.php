<?php

namespace kata;


use kata\model\DiscountCard;
use kata\model\TripRequest;

class TrainTicketEstimator
{
    /**
     * @throws \Exception
     */
    function estimate(TripRequest $trainDetails): float
    {
        if (count($trainDetails->passengers) === 0) {
            return 0;
        }

        if (strlen(trim($trainDetails->details->from)) === 0) {
            throw new \Exception("Start city is invalid");
        }

        if (strlen(trim($trainDetails->details->to)) === 0) {
            throw new \Exception("Destination city is invalid");
        }

        if ($trainDetails->details->when->getTimestamp() < (new \DateTime())->getTimeStamp()) {
            throw new \Exception("Date is invalid");
        }

        // TODO USE THIS LINE AT THE END
        $b = json_decode(file_get_contents("https://sncftrenitaliadb.com/api/train/estimate/price?from=" . $trainDetails->details->from . "&to=" . $trainDetails->details->to . "&date=" . $trainDetails->details->when->getTimestamp()), true)->price ?? -1;

        if ($b === -1) {
            throw new \Exception("ApiException");
        }

        $pasngers = $trainDetails->passengers;
        $tot = 0;
        $tmp = $b;

        for ($i = 0; $i < count($pasngers); ++$i) {
            if ($pasngers[$i]->age < 0) {
                throw new \Exception("Age is invalid");
            }

            if ($pasngers[$i]->age < 1) {
                continue;
            } // Seniors
            else if ($pasngers[$i]->age <= 17) {
                $tmp = $b * 0.6;
            } else if ($pasngers[$i]->age >= 70) {
                $tmp = $b * 0.8;
                if (in_array(DiscountCard::Senior, $pasngers[$i]->discounts)) {
                    $tmp -= $b * 0.2;
                }
            } else {
                $tmp = $b * 1.2;
            }

            $d = new \DateTime();
            $d->modify('+30 day');
            $date = $d->format('Y-m-d');

            if ($trainDetails->details->when->getTimestamp() >= $d->getTimestamp()) {
                $tmp -= $b * 0.2;
            } else {
                $d->modify('-30 day +5days');
                if ($trainDetails->details->when->getTimeStamp() > $d->getTimestamp()) {
                    $date1 = $trainDetails->details->when->getTimestamp();
                    $date2 = new \DateTime();

                    $diff = abs($date2->getTimestamp() - $date1);
                    $diffDays = ceil($diff / (3600 * 24));

                    $tmp += (20 - $diffDays) * 0.02 * $b;
                } else {
                    $tmp += $b;
                }
            }

            if ($pasngers[$i]->age > 0 && $pasngers[$i]->age < 4) {
                $tmp = 9;
            }

            if (in_array(DiscountCard::TrainStroke, $pasngers[$i]->discounts)) {
                $tmp = 1;
            }

            $tot += $tmp;
            $tmp = $b;
        }

        if (count($pasngers) == 2) {
            $cp = false;
            $mn = false;
            for ($i=0;$i<count($pasngers);$i++) {
                if (in_array(DiscountCard::Couple, $pasngers[$i]->discounts)) {
                    $cp = true;
                }
                if ($pasngers[$i]->age < 18) {
                    $mn = true;
                }
            }
            if ($cp && !$mn) {
                $tot -= $b * 0.2 * 2;
            }
        }

        if (count($pasngers) == 1) {
            $cp = false;
            $mn = false;
            for ($i = 0; $i < count($pasngers); $i++) {
                if (in_array(DiscountCard::HalfCouple, $pasngers[$i]->discounts)) {
                    $cp = true;
                }
                if ($pasngers[$i]->age < 18) {
                    $mn = true;
                }
            }
            if ($cp && !$mn) {
                $tot -= $b * 0.1;
            }
        }

        return $tot;
    }

    function print(): string
    {
        return "Hi!";
    }
}