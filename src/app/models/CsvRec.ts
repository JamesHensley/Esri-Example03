import { ICsvRec } from '../interfaces/ICsvRec';

export class CsvRec implements ICsvRec {
    public pointName: string;
    public longitude: string;
    public latitude: string;
    public timestamp: number;

    public HasNeighbors(radius: string): boolean {
        return false;
    }
}