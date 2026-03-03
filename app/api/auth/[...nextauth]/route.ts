import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { verifyPassword } from '@/lib/auth';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        console.log('[Auth] Starting authorization with email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.error('[Auth] Missing email or password');
          return null;
        }

        try {
          console.log('[Auth] Connecting to database...');
          await dbConnect();
          console.log('[Auth] Database connected successfully');

          const normalizedEmail = credentials.email.toLowerCase().trim();
          console.log('[Auth] Searching for user with email:', normalizedEmail);

          // Query the database for user
          const user = await User.findOne({ email: normalizedEmail }).select('+password');
          
          if (!user) {
            console.error('[Auth] User not found in database for email:', normalizedEmail);
            // Try to get count of all users for debugging
            const userCount = await User.countDocuments();
            console.log('[Auth] Total users in database:', userCount);
            return null;
          }

          console.log('[Auth] User found:', user._id, user.email);

          if (!user.isActive) {
            console.error('[Auth] Account deactivated for user:', normalizedEmail);
            return null;
          }

          console.log('[Auth] Verifying password for user:', normalizedEmail);
          
          // Verify password
          const isPasswordValid = await verifyPassword(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.error('[Auth] Invalid password for user:', normalizedEmail);
            return null;
          }

          console.log('[Auth] Authentication successful for user:', normalizedEmail);
          
          // Return user object if authentication successful
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            branchId: user.branchId?.toString(),
          };
        } catch (error: any) {
          console.error('[Auth] Authorization error:', error.message);
          console.error('[Auth] Error stack:', error.stack);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).branchId = token.branchId;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'default-secret-for-development',
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
});

export { handler as GET, handler as POST };


