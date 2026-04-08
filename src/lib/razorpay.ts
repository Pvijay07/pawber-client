export interface RazorpayOptions {
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id?: string;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: {
        color?: string;
    };
    handler: (response: any) => void;
    modal?: {
        ondismiss?: () => void;
    };
}

declare global {
    interface Window {
        Razorpay: any;
    }
    interface ImportMeta {
        readonly env: any;
    }
}

export const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export const initializeRazorpayPayment = (options: RazorpayOptions) => {
    const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_key',
        ...options,
        name: 'PetCare',
        theme: {
            color: '#10b981', // PetCare Primary Color
        },
    });
    rzp.open();
};
