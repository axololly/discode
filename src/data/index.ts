import * as _fE from './fileExts.json';
import * as _fN from './fileNames.json';
import * as _fP from './filePaths.json';
import * as _foN from './folderNames.json';
import * as _lI from './languageIDs.json';

interface Mapping {
    [key: string]: string;
}

export const fileExts: Mapping = _fE;
export const fileNames: Mapping = _fN;
export const filePaths: Mapping = _fP;
export const folderNames: Mapping = _foN;
export const languageIDs: Mapping = _lI;