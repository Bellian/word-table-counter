import { makeAutoObservable } from "mobx"
import { createContext } from "react";
import { v4 as uuidv4 } from 'uuid';


const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList =
    window.SpeechGrammarList || window.webkitSpeechGrammarList;


const grammar = `#JSGF V1.0; grammar number; public <number> = ${Array.from({ length: 100 }, (_, k) => k + 1).join(' | ')};`;
const speechRecognitionList = new SpeechGrammarList();
speechRecognitionList.addFromString(grammar, 1);


class TableStore {
    i = 1;
    loaded = false;
    table: Table | null = null;
    tables: Partial<Table>[] = [];
    lastTable: string | null = null;
    currentPage = 0;

    recognition!: SpeechRecognition;
    recognizing = false;
    ignoreOnend = false;
    startTimestamp = 0;
    lastEvent: Event | undefined;
    finalTranscript: string | undefined;
    interimTranscript: [string, string] = ['', ''];

    countingState: number[] = [];

    interimCallback: ((result: string) => void) | undefined;
    resultCallback: ((result: string) => void) | undefined;

    voices: SpeechSynthesisVoice[] = [];
    error: string = '';
    current: number = 1;

    constructor() {
        this.initListener();
        makeAutoObservable(this, {});
        this.loadTableList();
        this.loadLastTable();
        this.populateVoiceList();

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => {
                this.populateVoiceList();
            };
        }
        this.loaded = true;
    }

    get sortedTables() {
        return this.tables.slice().sort((a, b) => a.name!.localeCompare(b.name!))
    }

    get hasNextPage() {
        return this.table && (this.currentPage + 1) < this.table.pages;
    }

    get hasPrevPage() {
        return this.currentPage > 0;
    }

    get currentEntry() {
        switch (this.countingState.length) {
            case 0: return 'Seite';
            case 1: return 'Zeile';
            case 2: return 'Spalte';
        }
    }

    setPage(page: number) {
        this.currentPage = page;
    }

    initData(pages: number, lines: number, length: number) {
        const data: TableData = [];
        for (let i = 0; i < pages; i++) {
            data.push([]);
            for (let j = 0; j < lines; j++) {
                data[i].push([]);
                for (let k = 0; k < length; k++) {
                    data[i][j].push('');
                }
            }
        }
        return data;
    }

    setWord(value: string, line: number, element: number, page = this.currentPage) {
        if (!this.table) return;
        this.table.data[page][line][element] = value;
        this.saveTable();
    }

    createTable(name: string, voice: string, pages: number, lines: number, length: number) {
        this.table = {
            data: this.initData(pages, lines, length),
            id: uuidv4(),
            pages,
            length,
            lines,
            name,
            voice
        }
        this.tables.push({
            id: this.table.id,
            name: this.table.name,
        });

        this.currentPage = 0;
        this.setLastTable(this.table.id);
        this.saveTable();
        this.saveTableList();
    }

    saveTable() {
        localStorage.setItem(`table-${this.table?.id}`, JSON.stringify(this.table));
    }

    loadTable(id: string | null) {
        if (!id) {
            this.table = null;
            this.setLastTable(null);
        } else {
            const table = localStorage.getItem(`table-${id}`);
            if (!table) {
                this.loadTable(null);
                return;
            }
            this.currentPage = 0;
            this.table = JSON.parse(table);
            this.setLastTable(id);
        }
    }

    saveTableList() {
        localStorage.setItem(`tables`, JSON.stringify(this.tables));
    }

    loadTableList() {
        const tables = localStorage.getItem(`tables`);
        if (!tables) {
            return;
        }
        this.tables = JSON.parse(tables);
    }

    setLastTable(table: string | null) {
        this.lastTable = table;
        localStorage.setItem('last-table', this.lastTable ?? '');
    }

    loadLastTable() {
        this.lastTable = localStorage.getItem('last-table');
        if (!this.lastTable || this.lastTable === '') {
            this.lastTable = null;
        } else {
            this.loadTable(this.lastTable);
        }
    }


    startListener(event: Event, interimCallback?: (result: string) => void, resultCallback?: (result: string) => void) {
        this.finalTranscript = '';
        this.interimTranscript = ['', ''];
        this.recognition.lang = 'de-DE';
        this.recognition.grammars = speechRecognitionList;
        this.recognition.start();
        this.ignoreOnend = false;
        this.startTimestamp = event.timeStamp;
        this.interimCallback = interimCallback;
        this.resultCallback = resultCallback;
    }

    stopListener() {
        this.recognition.stop();
    }

    setFinalTransscript() {
        this.finalTranscript = this.interimTranscript.filter(e => e.length > 0).join(' ');
    }
    appendInterimTransscriptFinal(part: string) {
        this.interimTranscript[0] += part;
    }
    setInterimTransscript(part: string) {
        this.interimTranscript[1] = part;
    }
    setRecognizing(recognizing: boolean) {
        this.recognizing = recognizing;
    }

    initListener() {
        this.recognition = new SpeechRecognition();
        this.recognition.grammars = speechRecognitionList;
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.finalTranscript = '';

        this.recognition.onstart = () => {
            this.setRecognizing(true);
        };

        this.recognition.onerror = (event) => {
            console.log('voice Error');
            console.error(event);

            if (event.error == 'no-speech') {
                this.ignoreOnend = true;
            }

            if (event.error == 'network') {
                this.setError('Du brauchst Internet um dieses Feature zu nutzen.');
                setTimeout(() => {
                    this.setError('');
                }, 4000);
            }
            if (event.error == 'audio-capture') {
                this.ignoreOnend = true;
            }
            if (event.error == 'not-allowed') {
                if (event.timeStamp - this.startTimestamp < 100) {
                    console.log('info_blocked');
                } else {
                    console.log('info_denied');
                }
                this.ignoreOnend = true;
            }
        };

        this.recognition.onend = () => {
            this.speak('end');
            console.log('end');
            this.setRecognizing(false);
            this.setFinalTransscript();
            if (this.resultCallback) this.resultCallback(this.finalTranscript || '');

            if (this.ignoreOnend) {
                return;
            }
        };

        this.recognition.onresult = (event) => {
            let interim_transcript = '';
            if (typeof (event.results) == 'undefined') {
                this.recognition.onend = null;
                this.recognition.stop();
                return;
            }
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    this.appendInterimTransscriptFinal(event.results[i][0].transcript);
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            this.setInterimTransscript(interim_transcript);

            if (this.interimTranscript[0] || this.interimTranscript[1]) {
                if (this.interimCallback) this.interimCallback(this.interimTranscript.join(' '));
            }
        };
    }

    populateVoiceList() {
        this.voices = speechSynthesis.getVoices();
    }

    speak(text: string, voice?: string) {
        let oresolve: Function, oreject: Function;
        const promise = new Promise((resolve, reject) => {
            oresolve = resolve;
            oreject = reject;
        }).finally(() => {
        })
        const utterThis = new SpeechSynthesisUtterance(text);
        const selectedOption = voice ?? this.table?.voice;
        for (let i = 0; i < this.voices.length; i++) {
            if (this.voices[i].name === selectedOption) {
                utterThis.voice = this.voices[i];
            }
        }
        utterThis.onend = () => {
            oresolve();
        };
        utterThis.onerror = (ev) => {
            console.log(ev);
            if (ev.error === 'interrupted') return oresolve();
            oreject(ev.error);
        };
        speechSynthesis.speak(utterThis);
        return promise;
    }

    setError(error: string) {
        this.error = error;
    }

    counting = false;
    waitTimer = new WaitTimer();

    async count() {
        if (this.counting) {
            return;
        }
        this.finalTranscript = '';
        this.current = 0;
        this.counting = true;
        await this.waitTimer.wait();
        while (this.counting) {
            try {
                this.setCurrent(this.current + 1);
                await this.speak((this.current).toString());
                await this.waitTimer.wait();
            } catch (e) {
                console.error('Error in counting');
                if (e === undefined) continue;
                console.error(e);
                break;
            }
        }
        this.speak('Ende');
    }

    setCurrent(current: number) {
        this.current = current;
    }

    stopCounting() {
        this.waitTimer.stop();
        this.counting = false;
        speechSynthesis.cancel();
    }

    async addCountToState() {
        this.waitTimer.pause();
        await this.addCountingState(this.current);
        this.current = 0;
        this.waitTimer.continue();
        speechSynthesis.cancel();
    }

    async addCountingState(state: number) {
        this.countingState.push(Math.max(state - 1, 0));
        if (this.countingState.length >= 3) {
            // we have a sequence
            const [page, line, element] = this.countingState;
            this.countingState.length = 0;
            const word = this.table?.data[page][line][element] || 'Nicht Definiert';
            const wordToAdd = this.table?.data[page][line][element] || '-';
            this.finalTranscript += ' ' + wordToAdd;
            await this.speak(word);
        }
    }

    resetCount() {
        this.countingState = [];
        this.current = 0;
    }

    pauseCounting() {
        this.waitTimer.pause();
        this.setCurrent(this.current);
        const temp = this.waitTimer;
        this.waitTimer = undefined as any;
        this.waitTimer = temp;
    };

    continueCounting() {
        this.waitTimer.continue();
        this.setCurrent(this.current);
        const temp = this.waitTimer;
        this.waitTimer = undefined as any;
        this.waitTimer = temp;
    };


    compress(string: string, encoding: CompressionFormat) {
        const byteArray = new TextEncoder().encode(string);
        const cs = new CompressionStream(encoding);
        const writer = cs.writable.getWriter();
        writer.write(byteArray);
        writer.close();
        return new Response(cs.readable).arrayBuffer();
    }

    decompress(byteArray: ArrayBuffer, encoding: CompressionFormat) {
        const cs = new DecompressionStream(encoding);
        const writer = cs.writable.getWriter();
        writer.write(byteArray);
        writer.close();
        return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
            return new TextDecoder().decode(arrayBuffer);
        });
    }


}


class WaitTimer {
    duration = 1000;
    resolve: Function | undefined;
    timeout: number | undefined;
    promise: Promise<unknown> | undefined;
    paused = false;

    wait() {
        if (this.promise) return this.promise;
        this.promise = new Promise((resolve) => {
            this.resolve = resolve;
            if (!this.paused) {
                this.continue();
            }
        }).finally(() => {
            this.timeout = undefined;
            this.resolve = undefined;
            this.promise = undefined;
        });
        return this.promise;
    }
    pause() {
        this.paused = true;
        if (!this.timeout) return;
        clearTimeout(this.timeout);
        this.timeout = undefined;
    }
    stop() {
        this.pause();
        this.resolve = undefined;
        this.promise = undefined;
        this.paused = false;
    }
    continue() {
        this.paused = false;
        if (this.timeout || !this.resolve) return;
        this.timeout = setTimeout(this.resolve, this.duration);
    }
}

export const TableStoreInstance = new TableStore();
export const TableStoreContext = createContext(
    TableStoreInstance
);
export default TableStoreContext;



export type TableData = string[][][];

export interface Table {
    id: string;
    name: string;
    voice: string;
    data: TableData;
    pages: number;
    lines: number;
    length: number;
}