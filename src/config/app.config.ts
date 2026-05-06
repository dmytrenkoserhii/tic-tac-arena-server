export type AppConfig = {
  port: number
  supabaseAnonKey: string
  supabaseUrl: string
  webOrigin: string
}

export const appConfig = (): AppConfig => ({
  port: Number(process.env.PORT ?? 3000),
  supabaseAnonKey: readEnvVar('SUPABASE_ANON_KEY'),
  supabaseUrl: readEnvVar('SUPABASE_URL'),
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
})

function readEnvVar(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}
