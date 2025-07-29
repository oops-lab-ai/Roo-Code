import { HTMLAttributes, useEffect } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { Smartphone, CheckCircle } from "lucide-react"
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react'
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'

import { cn } from "@/lib/utils"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { vscode } from "@/utils/vscode"

import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import amplifyconfig from '../../amplify_outputs.json'
import { Amplify } from "aws-amplify"

Amplify.configure(amplifyconfig)


type MobileAuthProps = HTMLAttributes<HTMLDivElement>

export const MobileAuth = ({ className, ...props }: MobileAuthProps) => {
	const { t } = useAppTranslation()
	const { authStatus, user } = useAuthenticator((context) => [context.authStatus, context.user])
	const { cwd } = useExtensionState()
	const isAuthenticated = authStatus === 'authenticated'
  console.log('MobileAuth component rendered with authStatus:', authStatus, 'and user:', user)
	
  // Initialize workspace when user authenticates
	useEffect(() => {
		const initializeWorkspace = async () => {
			if (isAuthenticated && user) {
				try {
          const curr = await getCurrentUser()
          console.log('Current user fetched:', curr)
					// Fetch auth session to get access token
					const session = await fetchAuthSession()
          console.log('Auth session fetched:', session)
					const accessToken = session.tokens?.accessToken?.toString()
					
					console.log('Access token extracted:', {
						hasAccessToken: !!accessToken
					}, accessToken)

					// Send access token along with workspace initialization request
					vscode.postMessage({
						type: 'sendToDatabase',
						text: accessToken,
					})
					
					console.log('Workspace initialization requested with auth tokens')
				} catch (error) {
					console.error('Error initializing workspace:', error)
				}
			}
		}

		initializeWorkspace()
	}, [isAuthenticated, user])

	return (
		<div className={cn("flex flex-col gap-2", className)} {...props}>
			<SectionHeader description="Authenticate with AWS Amplify to sync with your mobile device">
				<div className="flex items-center gap-2">
					<Smartphone className="w-4" />
					<div>Mobile Authentication</div>
				</div>
			</SectionHeader>

			<Section>
				{isAuthenticated ? (
					<div className="flex items-center gap-3 p-4 bg-vscode-inputValidation-infoBackground border border-vscode-inputValidation-infoBorder rounded">
						<CheckCircle className="w-5 h-5 text-green-500" />
						<div>
							<div className="font-medium text-vscode-foreground">Successfully authenticated</div>
							<div className="text-sm text-vscode-descriptionForeground">
								You are signed in and can sync with your mobile device.
							</div>
						</div>
					</div>
				) : (
					<div className="space-y-4">
						<div className="text-vscode-descriptionForeground">
							<p className="mb-2">
								Sign in with your AWS Amplify account to sync tasks and data with your mobile device.
							</p>
						</div>

						<div className="border border-vscode-widget-border rounded p-4">
							<Authenticator>
								{({ signOut, user }) => (
									<div className="space-y-4">
										<div className="flex items-center gap-3">
											<CheckCircle className="w-5 h-5 text-green-500" />
											<div>
												<div className="font-medium text-vscode-foreground">
													Welcome, {user?.username}!
												</div>
												<div className="text-sm text-vscode-descriptionForeground">
													You are now authenticated and can sync with mobile.
												</div>
											</div>
										</div>
										<button
											onClick={signOut}
											className="px-4 py-2 bg-vscode-button-secondaryBackground text-vscode-button-secondaryForeground hover:bg-vscode-button-secondaryHoverBackground rounded">
											Sign Out
										</button>
									</div>
								)}
							</Authenticator>
						</div>
					</div>
				)}
			</Section>
		</div>
	)
}