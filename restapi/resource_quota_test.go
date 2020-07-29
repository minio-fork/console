package restapi

import (
	"context"
	"reflect"
	"testing"

	"errors"

	"github.com/minio/console/models"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type k8sClientMock struct{}

var k8sclientGetResourceQuotaMock func(ctx context.Context, namespace, resource string, opts metav1.GetOptions) (*v1.ResourceQuota, error)

// mock functions
func (c k8sClientMock) getResourceQuota(ctx context.Context, namespace, resource string, opts metav1.GetOptions) (*v1.ResourceQuota, error) {
	return k8sclientGetResourceQuotaMock(ctx, namespace, resource, opts)
}

func Test_ResourceQuota(t *testing.T) {
	mockHardResourceQuota := v1.ResourceList{
		"storage": resource.MustParse("1000"),
		"cpu":     resource.MustParse("2Ki"),
	}
	mockUsedResourceQuota := v1.ResourceList{
		"storage": resource.MustParse("500"),
		"cpu":     resource.MustParse("1Ki"),
	}
	mockRQResponse := v1.ResourceQuota{
		Spec: v1.ResourceQuotaSpec{
			Hard: mockHardResourceQuota,
		},
		Status: v1.ResourceQuotaStatus{
			Hard: mockHardResourceQuota,
			Used: mockUsedResourceQuota,
		},
	}
	mockRQResponse.Name = "ResourceQuota1"
	// k8sclientGetResourceQuotaMock = func(ctx context.Context, namespace, resource string, opts metav1.GetOptions) (*v1.ResourceQuota, error) {
	// 	return nil, nil
	// }
	ctx := context.Background()
	kClient := k8sClientMock{}
	type args struct {
		ctx    context.Context
		client K8sClient
	}
	tests := []struct {
		name              string
		args              args
		wantErr           bool
		want              models.ResourceQuota
		mockResourceQuota func(ctx context.Context, namespace, resource string, opts metav1.GetOptions) (*v1.ResourceQuota, error)
	}{
		{
			name: "Return resource quota elements",
			args: args{
				ctx:    ctx,
				client: kClient,
			},
			want: models.ResourceQuota{
				Name: mockRQResponse.Name,
				Elements: []*models.ResourceQuotaElement{
					&models.ResourceQuotaElement{
						Name: "storage",
						Hard: int64(1000),
						Used: int64(500),
					},
					&models.ResourceQuotaElement{
						Name: "cpu",
						Hard: int64(2048),
						Used: int64(1024),
					},
				},
			},
			mockResourceQuota: func(ctx context.Context, namespace, resource string, opts metav1.GetOptions) (*v1.ResourceQuota, error) {
				return &mockRQResponse, nil
			},
			wantErr: false,
		},
		{
			name: "Return empty resource quota elements",
			args: args{
				ctx:    ctx,
				client: kClient,
			},
			want: models.ResourceQuota{},
			mockResourceQuota: func(ctx context.Context, namespace, resource string, opts metav1.GetOptions) (*v1.ResourceQuota, error) {
				return &v1.ResourceQuota{}, nil
			},
			wantErr: false,
		},
		{
			name: "Handle error while fetching storage quota elementss",
			args: args{
				ctx:    ctx,
				client: kClient,
			},
			wantErr: true,
			mockResourceQuota: func(ctx context.Context, namespace, resource string, opts metav1.GetOptions) (*v1.ResourceQuota, error) {
				return nil, errors.New("error")
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			k8sclientGetResourceQuotaMock = tt.mockResourceQuota
			got, err := getResourceQuota(tt.args.ctx, tt.args.client, "ns", mockRQResponse.Name)
			if err != nil {
				if tt.wantErr {
					return
				}
				t.Errorf("getResourceQuota() error = %v, wantErr %v", err, tt.wantErr)
			}
			if reflect.DeepEqual(got, tt.want) {
				t.Errorf("got %v want %v", got, tt.want)
			}
		})
	}
}