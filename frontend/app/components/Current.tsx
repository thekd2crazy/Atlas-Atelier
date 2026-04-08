'use server'

import { compare } from "bcryptjs"
import { cookies } from "next/headers"

const secret = process.env.SECRET

export async function getCurrentUser() {
    // Get the session cookie
    const cookieStore = await cookies()
    const session = cookieStore.get('session')
    if (!session) return null

    // Check the signature
    const [login, signature] = session.value.split(';')
    const correct = await compare(signature, secret + login)

    return correct ? login : null
}