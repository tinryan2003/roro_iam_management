import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface User {
        id: string
        name: string
        email: string
        accessToken: string
        refreshToken: string
        idToken: string
    }

    interface Session {
        user: User & DefaultSession["user"]
        expires: string
        error?: string
        access_token?: string
        refresh_token?: string
        id_token?: string
        provider?: string
    }
}