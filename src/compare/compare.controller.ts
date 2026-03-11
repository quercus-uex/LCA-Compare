import {
  Body,
  Controller,
  Header,
  Post,
  StreamableFile,
} from '@nestjs/common';
import { CompareQueryDto } from './dto/compare-query.dto';
import { CompareService } from './compare.service';

@Controller('/compare')
export class CompareController {
  constructor(private readonly compareService: CompareService) {}

  @Post('')
  async compare(@Body() body: CompareQueryDto) {
    const { left, right } = body;

    const arr = [left, right];

    const filtersMean = await Promise.all(
      arr.map(async (filter) => {
        if (!filter) return;
        return this.compareService.getMeanInclusive(filter);
      }),
    );

    let result: { data: any };

    if (filtersMean[0] && filtersMean[1]) {
      result = {
        data: {
          left: filtersMean[0],
          right: filtersMean[1],
          diff: this.compareService.getDiffBetweenResults(
            filtersMean[0],
            filtersMean[1],
          ),
        },
      };
    } else {
      result = { data: { left: filtersMean[0], right: filtersMean[1] } };
    }

    return result;
  }

  @Post('/report')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename=report.pdf')
  async compareToReport(@Body() body: CompareQueryDto) {
    const result = await this.compare(body);
    const report = await this.compareService.generateReport(
      body.left,
      body.right!,
      result.data,
    );

    return new StreamableFile(report);
  }
}
