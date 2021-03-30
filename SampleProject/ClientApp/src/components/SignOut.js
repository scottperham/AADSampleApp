import React, { useContext } from 'react';
import { Card, CardBody, CardHeader, Button } from 'reactstrap';
import { AuthContext } from '../AuthProvider';

export default function SignOut() {

	const { authService, user } = useContext(AuthContext);
		
	const handleLocalSignOut = async (event) => {
		authService.signOut();
		window.location.href = "/signin";
	}

	return (
		<div>
			<Card className="mx-auto mb-3 border-light" style={{ maxWidth: "40rem" }}>
				<CardHeader>
					Sign out
				</CardHeader>
				<CardBody className="text-center">
					{authService.isLoggedIn() ?
						<>
							<div>Signed in as {user.displayName} {user.aad ? "local and with Azure AD" : "local only"}</div>
							<Button color="primary" onClick={handleLocalSignOut}>Sign Out</Button>
						</> :
						<div>You are not signed in</div>
					}
				</CardBody>
			</Card>
		</div>
	);
}