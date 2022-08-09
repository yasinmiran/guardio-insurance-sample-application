import React, {useMemo, useState} from "react";
import {Avatar, Button, Container, FlexboxGrid, Form, Modal, Stack} from "rsuite";
import AppSelectIcon from '@rsuite/icons/AppSelect';

import Enterprise from "../../data/templates/enterprise-identity-provider.json";
import Google from "../../data/templates/google.json";
import Facebook from "../../data/templates/facebook.json";
import styles from "./idp.module.css";
import config from "../../../config.json";
import {createIdentityProvider} from "./api";
import {useSession} from "next-auth/react";

const GOOGLE_ID = "google-idp";
const FACEBOOK_ID = "facebook-idp";
const ENTERPRISE_ID = "enterprise-idp";
const EMPTY_STRING = "";

export default function IdentityProviders() {

    const [idpList, setIdpList] = useState([]);
    const [openAddModal, setOpenAddModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(undefined);
    const {data: session} = useSession();

    const templates = useMemo(() => {
        return [
            Enterprise,
            Google,
            Facebook,
        ];
    });

    const onAddIdentityProviderClick = () => {
        setOpenAddModal(true);
    };

    const onCreationDismiss = () => {
        setSelectedTemplate(undefined)
    };

    const onIdPSave = async (formValues, template) => {

        const FIRST_ENTRY = 0;
        let model = {...template.idp};

        model.name = formValues.application_name.toString();

        if (FACEBOOK_ID === template.templateId) {
            model.federatedAuthenticators.authenticators[FIRST_ENTRY].properties = [
                {
                    "key": "ClientId",
                    "value": formValues.application_id.toString()
                },
                {
                    "key": "ClientSecret",
                    "value": formValues.application_secret.toString()
                },
                {
                    "key": "callBackUrl",
                    "value": `${config.WSO2IS_HOST}/t/${config.WSO2IS_TENANT_NAME}/commonauth`
                }
            ];
        } else if (GOOGLE_ID === template.templateId) {
            model.federatedAuthenticators.authenticators[FIRST_ENTRY].properties = [
                {
                    "key": "ClientId",
                    "value": formValues.client_id.toString()
                },
                {
                    "key": "ClientSecret",
                    "value": formValues.client_secret.toString()
                },
                {
                    "key": "callBackUrl",
                    "value": `${config.WSO2IS_HOST}/t/${config.WSO2IS_TENANT_NAME}/commonauth`
                },
                {
                    "key": "AdditionalQueryParameters",
                    "value": "scope=email openid profile"
                }
            ];
        } else {

        }

        model.federatedAuthenticators.authenticators[FIRST_ENTRY].isEnabled = true;

        const response = await createIdentityProvider({model, session});


    };

    return (
        <Container>
            <Stack justifyContent="space-between">
                <Stack direction="column" alignItems="flex-start">
                    <h2>Identity Providers</h2>
                    <p>Manage identity providers to allow users to log in to your application through them.</p>
                </Stack>
                <Stack>
                    <Button appearance="primary" size="lg" onClick={onAddIdentityProviderClick}>
                        Add Identity Provider
                    </Button>
                </Stack>
            </Stack>
            <FlexboxGrid
                style={{width: "100%", height: "60vh", marginTop: "24px"}}
                justify="center"
                align="middle">
                {idpList.length === 0 ? <EmptyIdentityProviderList/> : <p>list</p>}
            </FlexboxGrid>
            {
                openAddModal && (
                    <AddIdentityProviderModal
                        templates={templates}
                        onClose={() => setOpenAddModal(false)}
                        openModal={openAddModal}
                        onTemplateSelected={(template) => {
                            setOpenAddModal(false);
                            setSelectedTemplate(template);
                        }}
                    />
                )
            }
            {
                selectedTemplate && (
                    <IdPCreationModal
                        onSave={onIdPSave}
                        onCancel={onCreationDismiss}
                        openModal={!!selectedTemplate}
                        template={selectedTemplate}/>
                )
            }
        </Container>
    );

}

const AddIdentityProviderModal = ({openModal, onClose, templates, onTemplateSelected}) => {

    const handleClose = () => {
        onClose();
    };

    const resolveIconName = (template) => {
        if (GOOGLE_ID === template.templateId) {
            return "google.svg";
        }
        if (FACEBOOK_ID === template.templateId) {
            return "facebook.svg";
        }
        if (ENTERPRISE_ID === template.templateId) {
            return "enterprise.svg";
        }
        return EMPTY_STRING;
    };

    return (
        <Modal open={openModal}
               onClose={handleClose}
               onBackdropClick={handleClose}>
            <Modal.Header>
                <Modal.Title>Select Identity Provider</Modal.Title>
                <p>Choose one of the following identity providers.</p>
            </Modal.Header>
            <Modal.Body>
                <div>
                    <div className={styles.idp__template__list}>
                        {templates.map((template) => {
                            return (
                                <div
                                    key={template.id}
                                    className={styles.idp__template__card}
                                    onClick={() => onTemplateSelected(template)}>
                                    <div>
                                        <h5>{template.name}</h5>
                                        <small>{template.description}</small>
                                    </div>
                                    <Avatar src={`/icons/${resolveIconName(template)}`}/>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );

};

const EmptyIdentityProviderList = () => {

    return (
        <Stack alignItems="center" direction="column">
            <AppSelectIcon style={{opacity: .2}} width="150px" height="150px"/>
            <p style={{marginTop: "20px", fontSize: 14}}>
                There are no identity providers available at the moment.
            </p>
            <Button appearance="primary" size="md" style={{marginTop: "12px"}}>
                Add Identity Provider
            </Button>
        </Stack>
    );

};

const IdPCreationModal = ({openModal, onSave, onCancel, template}) => {

    const [formValues, setFormValues] = useState({});

    const handleModalClose = () => {
        onCancel();
    };

    const handleCreate = () => {
        onSave(formValues, template);
    };

    const resolveTemplateForm = () => {
        switch (template.templateId) {
            case GOOGLE_ID:
                return (
                    <GoogleIdentityProvider
                        formValues={formValues}
                        onFormValuesChange={setFormValues}/>
                )
            case FACEBOOK_ID:
                return (
                    <FacebookIdentityProvider
                        formValues={formValues}
                        onFormValuesChange={setFormValues}/>
                )
            case ENTERPRISE_ID:
                return (
                    <EnterpriseIdentityProvider
                        formValues={formValues}
                        onFormValuesChange={setFormValues}/>
                )
        }
    };

    return (
        <Modal open={openModal}
               onClose={handleModalClose}
               onBackdropClick={handleModalClose}>
            <Modal.Header>
                <Modal.Title>{template.name}</Modal.Title>
                <p>{template.description}</p>
            </Modal.Header>
            <Modal.Body>
                {resolveTemplateForm()}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={handleCreate}
                        appearance="primary">
                    Create
                </Button>
                <Button onClick={handleModalClose}
                        appearance="subtle">
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );

};

// --

const FacebookIdentityProvider = ({onFormValuesChange, formValues}) => {

    return (
        <Form onChange={onFormValuesChange} formValue={formValues}>
            <Form.Group controlId="application_name">
                <Form.ControlLabel>Application Name</Form.ControlLabel>
                <Form.Control name="application_name"/>
                <Form.HelpText tooltip>Application Name is Required</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="application_id">
                <Form.ControlLabel>Application ID</Form.ControlLabel>
                <Form.Control name="application_id" type="text" autoComplete="off"/>
                <Form.HelpText tooltip>Application ID is Required</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="application_secret">
                <Form.ControlLabel>Application Secret</Form.ControlLabel>
                <Form.Control name="application_secret" type="password" autoComplete="off"/>
                <Form.HelpText tooltip>Application Secret is Required</Form.HelpText>
            </Form.Group>
        </Form>
    );

}

const GoogleIdentityProvider = ({onFormValuesChange, formValues}) => {

    return (
        <Form onChange={onFormValuesChange} formValue={formValues}>
            <Form.Group controlId="application_name">
                <Form.ControlLabel>Application Name</Form.ControlLabel>
                <Form.Control name="application_name"/>
                <Form.HelpText tooltip>Application Name is Required</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="client_id">
                <Form.ControlLabel>Client ID</Form.ControlLabel>
                <Form.Control name="client_id" type="text" autoComplete="off"/>
                <Form.HelpText tooltip>Client ID is Required</Form.HelpText>
            </Form.Group>
            <Form.Group controlId="client_secret">
                <Form.ControlLabel>Client Secret</Form.ControlLabel>
                <Form.Control name="client_secret" type="password" autoComplete="off"/>
                <Form.HelpText tooltip>Client Secret is Required</Form.HelpText>
            </Form.Group>
        </Form>
    );

};

const EnterpriseIdentityProvider = () => {

    return (
        <p>enterprise</p>
    );

}
