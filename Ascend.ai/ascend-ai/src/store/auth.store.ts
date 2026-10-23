import {create} from "zustand"
import {persist} from "zustand/middleware"
import {User} from "@/types/auth"

interface AuthStore{
    user:User | null;
    
    loading: boolean;

    authenticated: boolean;

    setUser:(user:User | null) => void;

    setLoading:(loading:boolean) => void;

    logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            loading: true,
            authenticated: false,
            setUser: (user) => (set({user, authenticated: !!user})),
            setLoading: (loading) => (set({loading})),
            logout: () => (set({user: null, authenticated: false}))
        }),
        {
            name: "auth-storgae",
            partialize: (state) => ({
                user: state.user,
                authenticated: state.authenticated
            })
        }
    )
);