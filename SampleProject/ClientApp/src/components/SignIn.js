import React, { useState, useContext } from 'react';
import { Form, FormGroup, Label, Input, Card, CardBody, CardHeader, Button } from 'reactstrap';
import { Link, useHistory } from 'react-router-dom';
import { AuthContext } from '../AuthProvider';

export default function SignIn() {

	const { authService } = useContext(AuthContext);
	const hisory = useHistory();

	const [state, updateState] = useState({ email: null, password: null, error: null });

	const signInWithRedirectClick = () => {
		authService.signInAADRedirect();
	}

	const signInWithPopupClick = async () => {
		if (await authService.signInAADPopup()) {
			hisory.push("/profile");
		}
	}

	const handleLocalSignIn = async (event) => {

		event.preventDefault();

		const [result, error] = await authService.signInLocal(state.email, state.password);

		if (result) {
			hisory.push("/profile");
		}
		else {
			updateState({ error: error });
		}
	}

	const handleChange = (event) => {
		state[event.target.name] = event.target.value;
		updateState(state);
	}

	return (
		<div>
			<Card className="mx-auto mb-3 border-light" style={{ maxWidth: "40rem" }}>
				<CardHeader>
					Sign in with Azure Active Directory
				</CardHeader>
				<CardBody className="text-center">
					<Button color="primary" className="mr-3" onClick={signInWithRedirectClick}>Sign In with redirect</Button>
					<Button color="primary" onClick={signInWithPopupClick}>Sign In with popup</Button>
				</CardBody>
			</Card>

			<div className="text-center mb-3">OR</div>

			<Card className="mx-auto mb-3 border-light" style={{ maxWidth: "40rem" }}>
				<CardHeader>
					Sign in with email &amp; password
				</CardHeader>
				<CardBody>
					<Form onSubmit={handleLocalSignIn}>
						<FormGroup>
							<Label for="email">Email</Label>
							<Input onChange={handleChange} className={state.error ? "is-invalid" : ""} name="email" type="text" id="email" placeholder="Enter email..." />
							<div className="invalid-feedback">{state.error}</div>
						</FormGroup>
						<FormGroup>
							<Label for="password">Password</Label>
							<Input onChange={handleChange} className={state.error ? "is-invalid" : ""} name="password" type="password" id="password" placeholder="Enter password..." />
							<div className="invalid-feedback">{state.error}</div>
						</FormGroup>
						<div className="text-center">
							<Button color="primary" className="mr-3" type="submit">Sign in</Button>
							<Link to="/signup">Sign up</Link>
						</div>
					</Form>
				</CardBody>
			</Card>
		</div>
	);
}