import {Tabson} from '../../tabson';
const Runtime = {};

Runtime.enable = async (req, store, modem) => {
    modem.contextCreated();
    modem.replayFrontendRuntimeEvents(store);
    return null;
};

const getLocalsProperties = async(req, store, modem, objectId) => {
    modem.getStackScope(req.id, objectId.level, objectId.keys, 'locals');
    return 'ignoreme';
};

const getUpvaluesProperties = async(req, store, modem, objectId) => {
    modem.getStackScope(req.id, objectId.level, objectId.keys, 'upvalues');
    return 'ignoreme';
};

Runtime.getProperties = async(req, store, modem) => {

    const objectId = JSON.parse(req.params.objectId);
    if (objectId.group === 'locals') {
        return await getLocalsProperties(req, store, modem, objectId);
    }
    if (objectId.group === 'upvalues') {
        return await getUpvaluesProperties(req, store, modem, objectId);
    }

    if (!req.params.ownProperties) {
        return {result: []};
    }

    const docId = {id: objectId.id, group: objectId.group};
    const jsobj = await store.jsobjGet(JSON.stringify(docId));
    const tv = new Tabson(jsobj, docId);
    const result = tv.props(objectId.paths);

    if (result.internalProperties) {
        for (const p of result.internalProperties) {
            if (p.value.subtype === 'internal#location') {
                const scriptId = p.value.value.scriptId;
                await modem.scriptParsed(scriptId);
            }
        }
    }

    return result;
};

Runtime.discardConsoleEntries = async (req, store) => {
    await store.eventRemoveByMethod('Runtime.consoleAPICalled');
    return null;
};

Runtime.evaluate = async (req, store, modem) => {
    if (req.params.objectGroup !== 'console') {
        return null;
    }
    modem.getRepl(req.id, req.params.expression);
    return 'ignoreme';
};

export default Runtime;
