import React, { useContext, useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Container, Row, Col } from 'reactstrap';
import { AuthContext } from '../AuthProvider';
import { callAPI } from '../services/CallAPI';

export default function Profile() {

    const { apiToken, aadToken, graphToken } = useContext(AuthContext);

    const [{ profile, error }, setState] = useState({ profile: null, error: null });

    const fetchData = async () => {

        const { error, result } = await callAPI("/api/profile", {
            accessToken: aadToken
        }, apiToken);

        const profile = result;

        if (graphToken) {
            const { success, err, result } = await callAPI("https://graph.microsoft.com/v1.0/me", null, graphToken);

            profile["localMsIdentity"] = success ? result : null;

            if (success) {

                const { success, err, result } = await callAPI("https://graph.microsoft.com/v1.0/me/photo/$value", null, graphToken, "blob");

                if (success) {
                    profile.localMsIdentity["image"] = URL.createObjectURL(result);
                }
                else {
                    alert(err);
				}

            }
            else {
                alert(err);
            }
        }

        setState({ profile: profile, error: error });
    }

    useEffect(() => {
        if (apiToken) {
            fetchData();
        }
    }, [apiToken])

    return !profile || error ?
                <div>{error || "Loading..."}</div>
                : (<>
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
                        <Row className="mt-3">
                            <Col sm="2">Access Token:</Col>
                            <Col>{apiToken}</Col>
                        </Row>
                    </Container>
                </CardBody>
            </Card>

            { profile.microsoftIdentity &&
                <Card className="mx-auto mb-3 border-light">
                    <CardHeader>Server-Side Microsoft Identity</CardHeader>
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
                            <Row className="mt-3">
                                <Col sm="2">Access Token:</Col>
                                <Col>{aadToken}</Col>
                            </Row>
                        </Container>
                    </CardBody>
                </Card>

            }
            { profile.localMsIdentity &&
                <Card className="mx-auto mb-3 border-light">
                    <CardHeader>Client-Side Microsoft Identity</CardHeader>
                    <CardBody>
                        <Container>
                            <Row>
                                <Col sm="2">Image:</Col>
                                <Col><img alt="Profile" className="rounded-circle" src={profile.localMsIdentity.image} /></Col>
                            </Row>
                            <Row>
                                <Col sm="2">ID:</Col>
                            <Col>{profile.localMsIdentity.id}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Given Name:</Col>
                            <Col>{profile.localMsIdentity.givenName}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Surname:</Col>
                            <Col>{profile.localMsIdentity.surname}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Display Name:</Col>
                            <Col>{profile.localMsIdentity.displayName}</Col>
                            </Row>
                            <Row>
                                <Col sm="2">Mail:</Col>
                            <Col>{profile.localMsIdentity.mail}</Col>
                            </Row>
                            <Row className="mt-3">
                                <Col sm="2">Access Token:</Col>
                                <Col>{graphToken}</Col>
                            </Row>
                        </Container>
                    </CardBody>
                </Card>
            }</>)
}
