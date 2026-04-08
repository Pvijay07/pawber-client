export interface Package {
    id: string;
    name: string;
    price: number;
    duration: string;
    features: string[];
    isPopular?: boolean;
}

export interface Addon {
    id: string;
    name: string;
    price: number;
    duration: string;
}

export interface ServiceData {
    id: string;
    name: string;
    image: string;
    description: string;
    packages: Package[];
    addons: Addon[];
}

export const servicesData: Record<string, ServiceData> = {
    grooming: {
        id: 'grooming',
        name: 'Spa & Grooming',
        description: 'Professional grooming services for your furry friends. Most important revenue driver.',
        image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800&h=400',
        packages: [
            {
                id: 'basic-care',
                name: 'Basic Care',
                price: 700,
                duration: '45-60 mins',
                features: ['Bath + shampoo + blow dry', 'Nail trimming', 'Ear cleaning', 'Brushing'],
                isPopular: false,
            },
            {
                id: 'standard-groom',
                name: 'Standard Grooming',
                price: 800,
                duration: '60-90 mins',
                features: ['Everything in Basic Care', 'Hygiene trim', 'Teeth cleaning', 'Paw care'],
                isPopular: true,
            },
            {
                id: 'premium-full',
                name: 'Full Grooming Premium',
                price: 1499,
                duration: '90-150 mins',
                features: ['Full haircut + styling', 'Tick/flea treatment', 'Spa massage', 'Perfume'],
                isPopular: false,
            }
        ],
        addons: [
            { id: 'teeth', name: 'Teeth cleaning', price: 499, duration: '15 mins' },
            { id: 'tick', name: 'Tick treatment', price: 799, duration: '20 mins' },
            { id: 'pickup', name: 'Pickup & Drop', price: 399, duration: 'N/A' },
        ]
    },
    walking: {
        id: 'walking',
        name: 'Dog Walking',
        description: 'Subscription goldmine for recurring revenue.',
        image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=800&h=400',
        packages: [
            {
                id: 'starter-walk',
                name: 'Starter Plan',
                price: 199,
                duration: '20 mins',
                features: ['20 mins walk', '1 walk/day', 'Bathroom break', 'Fresh water'],
                isPopular: false,
            },
            {
                id: 'regular-walk',
                name: 'Regular Plan',
                price: 2499,
                duration: 'Monthly Subscription',
                features: ['30–40 min walks', 'Daily walks', 'GPS tracking + updates', 'Monthly report'],
                isPopular: true,
            },
            {
                id: 'premium-fitness',
                name: 'Premium Fitness Plan',
                price: 4999,
                duration: 'Monthly Subscription',
                features: ['2 walks/day', 'Active breed handling', 'Training included', 'Health monitoring'],
                isPopular: false,
            }
        ],
        addons: [
            { id: 'photo', name: 'Route Photo', price: 99, duration: 'N/A' },
            { id: 'paw-clean', name: 'Paw Cleaning', price: 149, duration: '10 mins' },
            { id: 'feeding', name: 'Feeding Service', price: 199, duration: '15 mins' },
        ]
    },
    boarding: {
        id: 'boarding',
        name: 'Boarding / Sitting',
        description: 'Safe home-style boarding with daily feeding and care.',
        image: 'https://images.unsplash.com/photo-1541599540903-21b123d96700?auto=format&fit=crop&q=80&w=800&h=400',
        packages: [
            {
                id: 'basic-boarding',
                name: 'Basic Boarding',
                price: 1000,
                duration: 'Per Day',
                features: ['Feeding', 'Basic supervision', 'Comfy bed', '3 Walks daily'],
                isPopular: false,
            },
            {
                id: 'premium-boarding',
                name: 'Premium Boarding',
                price: 1500,
                duration: 'Per Day',
                features: ['Playtime', 'Daily updates (photos/videos)', 'Walk included', 'Socialization'],
                isPopular: true,
            },
            {
                id: 'luxury-stay',
                name: 'Luxury Pet Stay',
                price: 3000,
                duration: 'Per Day',
                features: ['AC room / home stay', 'Grooming included', 'Vet on call', 'Premium food'],
                isPopular: false,
            }
        ],
        addons: [
            { id: 'extra-walk', name: 'Extra Walk', price: 199, duration: '20 mins' },
            { id: 'webcam', name: 'Webcam Access', price: 99, duration: 'Daily' },
            { id: 'special-meal', name: 'Special Meal', price: 299, duration: 'N/A' },
        ]
    },
    training: {
        id: 'training',
        name: 'Professional Training',
        description: 'Expert obedience and behavioral training. High brand authority.',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=800&h=400',
        packages: [
            {
                id: 'basic-train',
                name: 'Basic Training',
                price: 4000,
                duration: '5–7 sessions',
                features: ['Commands: sit, stay, come', 'Leash walking', 'Socialization', 'Hand signals'],
                isPopular: false,
            },
            {
                id: 'behavioral-train',
                name: 'Behavioral Training',
                price: 9000,
                duration: 'Custom sessions',
                features: ['Aggression control', 'Barking issues', 'Anxiety reduction', 'Professional assessment'],
                isPopular: true,
            },
            {
                id: 'advanced-train',
                name: 'Advanced Training',
                price: 20000,
                duration: 'Intensive sessions',
                features: ['Off-leash control', 'Guard training', 'Complex commands', 'Agility basics'],
                isPopular: false,
            }
        ],
        addons: [
            { id: 'consult-training', name: 'Behavioral Audit', price: 999, duration: '45 mins' },
            { id: 'clicker', name: 'Training Kit', price: 599, duration: 'N/A' },
            { id: 'video', name: 'Video Support', price: 1499, duration: 'LIFETIME' },
        ]
    },
    vet: {
        id: 'vet',
        name: 'Veterinary Care',
        description: 'Expert medical attention for your pets.',
        image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&q=80&w=800&h=400',
        packages: [
            {
                id: 'consult',
                name: 'General Consultation',
                price: 499,
                duration: '20 mins',
                features: ['Physical exam', 'Health advice', 'Weight check', 'Basic vitals'],
                isPopular: true,
            },
            {
                id: 'full-check',
                name: 'Comprehensive Checkup',
                price: 1299,
                duration: '45 mins',
                features: ['Full body exam', 'Dental check', 'Joint assessment', 'Nutrition review'],
                isPopular: false,
            },
            {
                id: 'vaccine',
                name: 'Vaccination Clinic',
                price: 899,
                duration: '15 mins',
                features: ['Core vaccines', 'Immunity check', 'Health record update'],
                isPopular: false,
            }
        ],
        addons: [
            { id: 'blood', name: 'Blood Test', price: 999, duration: '30 mins' },
            { id: 'deworm', name: 'Deworming', price: 299, duration: '10 mins' },
            { id: 'cert', name: 'Health Certificate', price: 499, duration: 'N/A' },
        ]
    }
};

/**
 * Safely retrieves service data by ID with a fallback mechanism.
 */
export const getServiceById = (id: string): ServiceData => {
    return servicesData[id] || servicesData['grooming'];
};
