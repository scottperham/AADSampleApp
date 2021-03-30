import React, { useContext, useEffect, useState } from 'react';
import { Table, Button, Card, CardHeader, CardBody, Container, Row, Col } from 'reactstrap';
import { AuthContext } from '../AuthProvider';
import { callAPI } from '../services/CallAPI';

export default function Profile() {

    const { apiToken, aadToken } = useContext(AuthContext);

    const [{ profile, error }, setState] = useState({ profile: null, error: null });

    const fetchData = async () => {

        const { _, error, result } = await callAPI("/api/profile", {
            accessToken: aadToken
        }, apiToken);

        setState({ profile: result, error: error });
    }

    useEffect(() => {
        if (apiToken) {
            fetchData();
        }
    }, [apiToken])

    return !profile || error ?
                <div>{error || "Loading..."}</div>
                :
            <>
            <Card className="mx-auto mb-3 border-light">
                <CardHeader>Local Identity</CardHeader>
                <CardBody>
                    <Container>
                        <Row>
                            <Col sm="2">Display Name:</Col>
                            <Col>{profile.localIdentity.displayName}</Col>
                        </Row>
                        <Row>
                            <Col sm="2">Email:</Col>
                            <Col>{profile.localIdentity.email}</Col>
                        </Row>
                    </Container>
                </CardBody>
            </Card>

            { profile.microsoftIdentity &&
                <Card className="mx-auto mb-3 border-light">
                    <CardHeader>Microsoft Identity</CardHeader>
                    <CardBody>
                        <Container>
                            <Row>
                                <Col sm="2">ID:</Col>
                                <Col>{profile.microsoftIdentity.id}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Given Name:</Col>
                                <Col>{profile.microsoftIdentity.givenName}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Surname:</Col>
                                <Col>{profile.microsoftIdentity.surname}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Display Name:</Col>
                                <Col>{profile.microsoftIdentity.displayName}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Mail:</Col>
                                <Col>{profile.microsoftIdentity.mail}</Col>
                            </Row>
                        </Container>
                    </CardBody>
                </Card>
            }
            </>
}
