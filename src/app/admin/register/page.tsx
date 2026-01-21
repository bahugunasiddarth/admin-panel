import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Creation Process</CardTitle>
          <CardDescription>
            For security, new admin accounts must be configured manually in Firestore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
          <p>
            Creating an admin user is a two-step process. This ensures that only authorized personnel can gain admin access.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Step 1: Create a User Account</h3>
            <p className="text-sm text-muted-foreground">
              First, a user account must exist. You can either use an account created through your website's normal sign-up process, or you can go to your Firebase Console, select your project ({'`'}khushi-jewels{`}`}), navigate to the {'`'}Authentication{`' `}
              section, and add a new user with an email and password.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Assign the Admin Role in Firestore</h3>
            <p className="text-sm text-muted-foreground">
              Go to your Firestore Database in the Firebase Console. Navigate to the {'`'}users{`'`} collection and find the document corresponding to the user you want to make an admin (the document ID will be the user's UID from the Authentication tab).
            </p>
             <p className="text-sm text-muted-foreground">
              Inside that user's document, click {'"'}Add field{'"'}. Set the field name to {'`'}isAdmin{`'`}, select {'`'}boolean{`'`} as the type, and set its value to {'`'}true{`'`}.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/admin/login"
              className="text-sm underline underline-offset-4 hover:text-primary"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
