import * as _fE from './fileExts.json';
import * as _fN from './fileNames.json';
import * as _fP from './filePaths.json';
import * as _foN from './folderNames.json';
import * as _lID from './languageIDs.json';

export interface FileMappings {
    [key: string]: string;
}

export const fileExts = _fE as FileMappings;
export const fileNames = _fN as FileMappings;
export const filePaths = _fP as FileMappings;
export const folderNames = _foN as FileMappings;
export const languageIDs = _lID as FileMappings;