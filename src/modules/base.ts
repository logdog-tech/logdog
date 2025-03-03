export interface BaseLine {
    filename: string;
    line: number;
    content: string;

    time?: string;
    pid?: number;
    tid?: number;
    level?: string;
    body?: string;
    originalIndex: number;
    isSearched?: boolean;
    isMarked?: boolean;
}


export type FileStatus = "pending" | "extracting" | "extracted" | "isConnected" | "notConnected" | "connecting";

export interface LogFile {
    id?: number;
    // 原始文件，即用户从浏览器选择的文件句柄
    rawFile: File;

    // 文件路径，如果是压缩文件，这个路径是一个组合格式，"/a/b/c@/d/e/f.txt"
    path: string;

    size: number;

    status: FileStatus;

    isLogFile: boolean;

    // 日志行数
    lineCount?: number;

    isRemoteMode?: boolean;

    name: string;

    desc: string;

    getDisplayStatus(): string;
}

export class SimpleLogFile implements LogFile {
    rawFile: File;
    path: string;
    size: number;
    status: FileStatus;
    isLogFile: boolean;
    lineCount?: number;
    isRemoteMode?: boolean;
    name: string;
    private _desc: string = "";

    constructor(rawFile: File, path: string, size: number, status: FileStatus, isLogFile: boolean, lineCount?: number, isRemoteMode?: boolean) {
        this.rawFile = rawFile;
        this.path = path;
        this.size = size;
        this.status = status;
        this.isLogFile = isLogFile;
        this.lineCount = lineCount;
        this.isRemoteMode = isRemoteMode;
        this.name = this.path.split('/').pop() || '';
        this.desc = path;
    }

    set desc(value: string) {
        this._desc = value;
    }

    get desc() {
        return this._desc;
    }

    getDisplayStatus(): string {
        if (this.isRemoteMode) {
            if (this.status === 'notConnected') {
                return '未连接';
            }
            if (this.status === 'connecting') {
                return '连接中';
            }
            if (this.status === 'isConnected') {
                return '已连接';
            }
        }
        if (!this.isLogFile) {
            return '非日志文件';
        }
        if (this.status === 'pending') {
            return '等待处理';
        }
        if (this.status === 'extracting') {
            return '正在处理';
        }
        if (this.status === 'extracted') {
            return this.lineCount !== undefined ? `${this.lineCount} 行` : '加载中';
        }
        return this.status;
    }
}

export interface User {
    id: number;
    nickname?: string;
    openid?: string;
    email?: string;
    avatar?: string;
    created_at?: string;
}

export interface Workspace {
    id: number;
    workspace_name: string;
    workspace_desc?: string;
    is_public: boolean;
    created_by: number;
    created_at: string;
    updated_at: string;
    _is_local?: boolean;
}

export interface WorkspaceUser {
    id: number;
    workspace_id: number;
    user_id: number;
    role: string;
    joined_at: string;
}

export interface Rule {
    id: number;
    uuid: string;
    workspace_id?: number;
    user_id: number;
    rule_type: 'filter' | 'color' | 'function';
    rule_name: string;
    rule_desc?: string;
    is_public: boolean;
    fg_color?: string;
    bg_color?: string;
    pattern?: string;
    replacement?: string;
    custom_function?: string;
    tags?: string;
    created_at: string;
    updated_at: string;
    _checked?: boolean;
    _is_editing?: boolean;
    _is_adding?: boolean;
}

export interface Favorite {
    id: number;
    user_id: number;
    rule_id: number;
    created_at: string;
}

// 显示模式
export enum DisplayMode {
    MARK_AND_SEARCH = 'markAndSearch',
    ONLY_MARK = 'onlyMark',
    ONLY_SEARCH = 'onlySearch',
}

