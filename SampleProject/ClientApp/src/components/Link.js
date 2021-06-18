import React, { useContext } from 'react';
import { Card, CardBody, CardHeader, Button } from 'reactstrap';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';

export default function SignIn() {

	const { aadToken, authService } = useContext(AuthContext);
	const hisory = useHistory();

	const handleLink = async (link) => {
		if (await authService.linkIdentity(aadToken, link)) {
			hisory.push("/profile");
		}
	}

	return (
		<div>
			<Card className="mx-auto mb-3 border-light" style={{ maxWidth: "40rem" }}>
				<CardHeader>
					We found an account! Would you like to link it to this org?
				</CardHeader>
				<CardBody className="text-center">
					<Button color="primary" className="mr-3" onClick={() => handleLink(true)}>Yes! Link my account</Button>
					<Button color="primary" onClick={() => handleLink(false)}>No thanks</Button>
				</CardBody>
			</Card>
		</div>
	);
}