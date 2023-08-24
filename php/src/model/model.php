<?php

namespace kata\model;

//declare an enum class with 4 values

enum DiscountCard {
    case Senior;
    case TrainStroke;
    case Couple;
    case HalfCouple;
}

class Passenger {
    public int $age;
    public array $discounts;

    function __construct(int $age, array $discounts)
    {
        $this->age = $age;
        $this->discounts = $discounts;
    }
}

class TripDetails {
    public string $from;
    public string $to;
    public \DateTime $when;

    function __construct(string $from, string $to, \DateTime $when) {
        $this->from = $from;
        $this->to = $to;
        $this->when = $when;
    }
}

class TripRequest {
    public TripDetails $details;
    public array $passengers;

    function __construct(TripDetails $details, array $passengers) {
        $this->details = $details;
        $this->passengers = $passengers;
    }
}