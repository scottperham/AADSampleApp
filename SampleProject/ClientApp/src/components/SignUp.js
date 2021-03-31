import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Form, FormGroup, Label, Input, Card, CardBody, CardHeader, Button, Alert } from 'reactstrap';
import { callAPI } from '../services/CallAPI';

export default function SignUp() {

	const history = useHistory();

	const [state, updateState] = useState({ email: "", password: "", displayName: "", error: null });

	const handleSignUp = async (event) => {

		event.preventDefault();

		const {success, error} = await callAPI("/api/signUp", {
			email: state.email,
			password: state.password,
			displayName: state.displayName
		}, null, "text");

		if (success) {
			history.push("/signin");
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
			<Alert color="danger" isOpen={ state.error }>{state.error}</Alert>
			<Card className="mx-auto mb-3 border-light" style={{ maxWidth: "40rem" }}>
				<CardHeader>
					Sign up!
				</CardHeader>
				<CardBody>
					<Form onSubmit={handleSignUp}>
						<FormGroup>
							<Label for="displayName">Display Name</Label>
							<Input onChange={handleChange} name="displayName" type="text" id="displayName" placeholder="Enter display name..." />
						</FormGroup>
						<FormGroup>
							<Label for="email">Email</Label>
							<Input onChange={handleChange} name="email" type="text" id="email" placeholder="Enter email..." />
						</FormGroup>
						<FormGroup>
							<Label for="password">Password</Label>
							<Input onChange={handleChange} name="password" type="password" id="password" placeholder="Enter password..." />
						</FormGroup>
						<div className="text-center">
							<Button color="primary" type="submit">Sign up</Button>
						</div>
					</Form>
				</CardBody>
			</Card>
		</div>
	);
}