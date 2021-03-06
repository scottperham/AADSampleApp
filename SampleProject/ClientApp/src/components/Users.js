import React, { useContext, useEffect, useState, useCallback } from 'react';
import { Table, Button } from 'reactstrap';
import { AuthContext } from '../AuthProvider';
import { callAPI } from '../services/CallAPI';

export default function Users() {

    const { apiToken } = useContext(AuthContext);

    const [{ users, error }, setState] = useState({users: null, error: null});

    const fetchData = useCallback(async () => {

        const { error, result } = await callAPI("/api/users", null, apiToken);

        setState({ users: result, error: error });
    }, [apiToken]);

    useEffect(() => {
        if (apiToken) {
            fetchData();
        }
    }, [apiToken, fetchData])

    const deleteClick = async (id) => {

        if (!window.confirm("Deleting this user cannot be undone.\r\nAre you sure you want to continue?")) {
            return;
        }

        const { success, error } = await callAPI("/api/users/delete", {
            id: id
        }, apiToken);

        if (success) {
            await fetchData();
            return;
        }

        setState({ users: null, error: error });
	}

    return(
        <Table>
            <thead>
                <tr>
                    <th scope="col">Display Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">AAD Linked</th>
                    <th scope="col">Local Account</th>
                    <th scope="col">&nbsp;</th>
                </tr>
            </thead>
            <tbody>
                {!users || error ?
                    <tr>
                        <td colSpan="5">
                            {error || "Loading..."}
                        </td>
                    </tr>
                    :
                    users.map(user => {return (
                        <tr key={user.id}>
                            <td>{user.displayName}</td>
                            <td>{user.email}</td>
                            <td>{user.aadLinked.toString()}</td>
                            <td>{user.localAccount.toString()}</td>
                            <td><Button onClick={() => deleteClick(user.id) }>Delete</Button></td>
                        </tr>)
					})
                }
            </tbody>
        </Table>
    );
}
